import envConfig from '@/config'
import { validateMessageContent } from '@/middleware/ai-security'
import { createFaqAgentTools } from '@/services/agents/faq.agent'
import { createOrderAgentTools } from '@/services/agents/order.agent'
import { createSearchAgentTools } from '@/services/agents/search.agent'
import { aiMemoryService } from '@/services/ai-memory.service'
import { AgentIntent, aiRouterService } from '@/services/ai-router.service'
import { promptBuilderService } from '@/services/prompt-builder.service'
import { getContextLogger } from '@/utils/logger'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import crypto from 'crypto'
import { FastifyReply } from 'fastify'

/** Max tokens a single session is allowed to consume before being cut off. */
const SESSION_TOKEN_BUDGET = 50_000

// Convert raw client messages to UIMessage-like format for convertToModelMessages
function toUIMessages(
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
) {
  return messages.map((msg, index) => {
    const parts: Array<{ type: 'text'; text: string }> = []

    if (typeof msg.content === 'string' && msg.content) {
      parts.push({ type: 'text' as const, text: msg.content })
    } else if (msg.parts) {
      for (const p of msg.parts) {
        if (p.type === 'text' && p.text) {
          parts.push({ type: 'text' as const, text: p.text })
        }
      }
    }

    if (parts.length === 0) {
      parts.push({ type: 'text' as const, text: '' })
    }

    return {
      id: `msg-${index}`,
      role: msg.role as 'user' | 'assistant',
      parts
    }
  })
}

class AiChatService {
  private openrouter = createOpenRouter({
    apiKey: envConfig.OPENROUTER_API_KEY
  })

  async handleChat(
    messages: Array<Record<string, unknown>>,
    userId: string,
    sessionId: string | undefined,
    reply: FastifyReply,
    guestId?: number
  ) {
    const log = getContextLogger()

    // 1. Security: validate message content + prompt injection check
    const flatMessages = messages.map((m) => ({
      role: String(m.role || 'user'),
      content:
        typeof m.content === 'string'
          ? m.content
          : Array.isArray(m.parts)
            ? (m.parts as Array<{ type: string; text?: string }>)
                .filter((p) => p.type === 'text')
                .map((p) => p.text || '')
                .join('')
            : ''
    }))

    const validation = validateMessageContent(flatMessages)
    if (!validation.valid) {
      reply.status(400).send({ error: validation.error })
      return
    }

    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      const session = sessionId || crypto.randomUUID()
      // Retrieve session history and progressive summary
      const memoryResult = await aiMemoryService.getSession(session)
      let memorySummary = memoryResult.summary
      let summaryVersion = memoryResult.summaryVersion

      // 2. Build dynamic system prompt from DB (restaurant info + FAQs) and inject memory summary
      const systemPrompt = await promptBuilderService.buildSystemPrompt(userId, { summary: memorySummary })

      // 3. Convert incoming messages to UIMessage format
      const newUiMessages = toUIMessages(
        messages as Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
      )

      // 3.5. Token budget check — refuse if session exceeded limit
      const sessionTokens = await aiMemoryService.getSessionTokens(session)
      if (sessionTokens >= SESSION_TOKEN_BUDGET) {
        log?.warn(`[AI Chat] Session ${session} exceeded token budget (${sessionTokens}/${SESSION_TOKEN_BUDGET})`)
        reply.status(429).send({
          error: `Chat session has exceeded the token limit (${SESSION_TOKEN_BUDGET.toLocaleString()}). Please start a new conversation.`
        })
        return
      }

      // Combine previous messages with new incoming messages
      const fullUiHistory = [...memoryResult.messages, ...newUiMessages]

      // Extract hot window (last N messages) and identify newly evicted messages
      const { hotMessages, evictedMessages } = aiMemoryService.buildContextWithSummary(fullUiHistory)
      const needsNewSummary = evictedMessages.length > 0

      // 3.8. Route the Intent
      // Grab the last 4 messages from hotMessages for faster classification
      const recentMessages = hotMessages.slice(-4)
      const intent: AgentIntent = await aiRouterService.classifyIntent(recentMessages)

      // 3.9. Dynamically select tools based on intent
      let agentTools: any = {}
      if (intent === 'SEARCH') {
        agentTools = createSearchAgentTools()
      } else if (intent === 'ORDER') {
        agentTools = createOrderAgentTools({ guestId })
      } else if (intent === 'FAQ') {
        agentTools = createFaqAgentTools()
      }
      // GENERAL intent gets no specific tools, just standard chat.

      const modelMessages = await convertToModelMessages(hotMessages)

      log?.info(
        `[AI Chat] Starting streamText (Session: ${session}, Intent: ${intent}, Hot History: ${hotMessages.length}, Tokens used: ${sessionTokens})`
      )

      // 4. Stream text with tool calling + 30s timeout
      const abortController = new AbortController()
      timeout = setTimeout(() => abortController.abort(), 30_000)

      const result = streamText({
        model: this.openrouter.chat('google/gemini-2.5-flash'),
        maxOutputTokens: 2048, // Limit per-request cost — đủ cho restaurant assistant
        system: systemPrompt,
        messages: modelMessages,
        tools: Object.keys(agentTools).length > 0 ? agentTools : undefined,
        stopWhen: stepCountIs(5),
        abortSignal: abortController.signal,
        onFinish: async (event) => {
          clearTimeout(timeout)
          // On finish, append the assistant's ultimate reply to the UI history and save
          try {
            // Only save text content from assistant messages.
            // Tool-call/tool-result parts are NOT compatible with convertToModelMessages
            // on reload, and the assistant's text already contains all useful context.
            const newMessages = event.response.messages
              .filter((msg) => msg.role === 'assistant')
              .map((msg) => {
                const textParts = ((msg.content || []) as any[])
                  .filter((c: any) => c.type === 'text' && c.text)
                  .map((c: any) => ({ type: 'text' as const, text: c.text }))

                return {
                  id: `msg-asst-${Date.now()}-${Math.random()}`,
                  role: 'assistant' as const,
                  parts: textParts.length > 0 ? textParts : [{ type: 'text' as const, text: '' }]
                }
              })
              .filter((msg) => msg.parts.some((p) => p.text !== ''))

            // Combine previous hot window with the new messages
            const updatedHistory = [...hotMessages, ...newMessages]

            // If messages were evicted from the hot window, generate a new progressive summary asynchronously
            if (needsNewSummary) {
              log?.info(`[AI Memory] Generating progressive summary for ${evictedMessages.length} evicted messages`)
              memorySummary = await aiMemoryService.generateProgressiveSummary(memorySummary, evictedMessages)
              summaryVersion++
            }

            const parsedUserId = userId !== 'guest' ? parseInt(userId) : undefined
            await aiMemoryService.saveSession(
              session,
              updatedHistory,
              { accountId: parsedUserId, guestId },
              event.usage
                ? {
                    promptTokens: event.usage.inputTokens || 0,
                    completionTokens: event.usage.outputTokens || 0,
                    totalTokens: event.usage.totalTokens || 0
                  }
                : undefined,
              memorySummary,
              summaryVersion
            )
          } catch (e) {
            log?.error({ err: e }, '[AI Chat] Failed to save session on finish')
          }
        }
      })

      // 5. Pipe the stream directly to Fastify's raw response
      reply.hijack()

      const response = result.toUIMessageStreamResponse()
      const headers: Record<string, string> = {
        'x-ai-session-id': session
      }
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      reply.raw.writeHead(response.status || 200, headers)

      if (response.body) {
        const reader = response.body.getReader()
        const pump = async () => {
          let done = false
          while (!done) {
            const result = await reader.read()
            done = result.done
            if (done) {
              reply.raw.end()
            } else {
              reply.raw.write(result.value)
            }
          }
        }
        await pump()
      } else {
        reply.raw.end()
      }
    } catch (error: unknown) {
      clearTimeout(timeout)
      const isAbort = error instanceof Error && error.name === 'AbortError'
      if (isAbort) {
        log?.warn('[AI Chat] Request timed out after 30s')
      } else {
        log?.error({ err: error }, '[AI Chat] Error')
      }

      if (!reply.raw.headersSent) {
        reply.status(isAbort ? 504 : 500).send({
          error: isAbort ? 'AI is currently overloaded, please try again shortly.' : 'Failed to process AI chat request'
        })
      } else {
        reply.raw.end()
      }
    }
  }
}

export const aiChatService = new AiChatService()
