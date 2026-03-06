import envConfig from '@/config'
import { validateMessageContent } from '@/middleware/ai-security'
import { aiMemoryService } from '@/services/ai-memory.service'
import { aiTools } from '@/services/ai-tools'
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

    try {
      // 2. Build dynamic system prompt from DB (restaurant info + FAQs)
      const systemPrompt = await promptBuilderService.buildSystemPrompt(userId)

      // 3. Convert to UIMessage format then to ModelMessages
      const newUiMessages = toUIMessages(
        messages as Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
      )

      const session = sessionId || crypto.randomUUID()
      const previousMessages = await aiMemoryService.getSession(session)

      // 3.5. Token budget check — refuse if session exceeded limit
      const sessionTokens = await aiMemoryService.getSessionTokens(session)
      if (sessionTokens >= SESSION_TOKEN_BUDGET) {
        log?.warn(`[AI Chat] Session ${session} exceeded token budget (${sessionTokens}/${SESSION_TOKEN_BUDGET})`)
        reply.status(429).send({
          error: `Phiên chat đã vượt giới hạn token (${SESSION_TOKEN_BUDGET.toLocaleString()}). Vui lòng bắt đầu cuộc trò chuyện mới.`
        })
        return
      }

      // Combine previous messages with new incoming messages
      const fullUiHistory = [...previousMessages, ...newUiMessages]
      const windowedUiHistory = aiMemoryService.applySlidingWindow(fullUiHistory, 20)

      const modelMessages = await convertToModelMessages(windowedUiHistory)

      log?.info(
        `[AI Chat] Starting streamText (Session: ${session}, History: ${windowedUiHistory.length}, Tokens used: ${sessionTokens})`
      )

      // 4. Stream text with tool calling + 30s timeout
      const abortController = new AbortController()
      const timeout = setTimeout(() => abortController.abort(), 30_000)

      const result = streamText({
        model: this.openrouter.chat('google/gemini-2.5-flash'),
        maxOutputTokens: 2048, // Limit per-request cost — đủ cho restaurant assistant
        system: systemPrompt,
        messages: modelMessages,
        tools: aiTools,
        stopWhen: stepCountIs(5),
        abortSignal: abortController.signal,
        onFinish: async (event) => {
          clearTimeout(timeout)
          // On finish, append the assistant's ultimate reply to the UI history and save
          try {
            // Map all generated messages (assistant + tool) from the run
            const newMessages = event.response.messages.map((msg) => ({
              id: `msg-asst-${Date.now()}-${Math.random()}`,
              role: msg.role, // 'assistant' or 'tool'
              parts: ((msg.content || []) as any[]).map((c: any) => ({
                type: c.type,
                ...(c.type === 'text' && { text: c.text }),
                ...(c.type === 'tool-call' && {
                  toolInvocation: {
                    state: 'call',
                    toolCallId: c.toolCallId,
                    toolName: c.toolName,
                    args: c.args
                  }
                })
              }))
            }))

            // Combine previous window with the new messages
            const updatedHistory = [...windowedUiHistory, ...newMessages]

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
                : undefined
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
      const isAbort = error instanceof Error && error.name === 'AbortError'
      if (isAbort) {
        log?.warn('[AI Chat] Request timed out after 30s')
      } else {
        log?.error({ err: error }, '[AI Chat] Error')
      }

      if (!reply.raw.headersSent) {
        reply.status(isAbort ? 504 : 500).send({
          error: isAbort ? 'AI đang quá tải, vui lòng thử lại sau giây lát.' : 'Failed to process AI chat request'
        })
      } else {
        reply.raw.end()
      }
    }
  }
}

export const aiChatService = new AiChatService()
