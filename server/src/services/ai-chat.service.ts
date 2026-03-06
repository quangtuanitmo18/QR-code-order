import envConfig from '@/config'
import { validateMessageContent } from '@/middleware/ai-security'
import { aiMemoryService } from '@/services/ai-memory.service'
import { aiTools } from '@/services/ai-tools'
import { promptBuilderService } from '@/services/prompt-builder.service'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import crypto from 'crypto'
import { FastifyReply } from 'fastify'

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
    reply: FastifyReply
  ) {
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

      // Combine previous messages with new incoming messages
      const fullUiHistory = [...previousMessages, ...newUiMessages]
      const windowedUiHistory = aiMemoryService.applySlidingWindow(fullUiHistory, 20)

      const modelMessages = await convertToModelMessages(windowedUiHistory)

      console.log(
        `[AI Chat] Starting streamText with tools... (Session: ${session}, History length: ${windowedUiHistory.length})`
      )

      // 4. Stream text with tool calling (AI SDK v6)
      const result = streamText({
        model: this.openrouter.chat('google/gemini-2.5-flash'),
        system: systemPrompt,
        messages: modelMessages,
        tools: aiTools,
        stopWhen: stepCountIs(5),
        onFinish: async (event) => {
          // On finish, append the assistant's ultimate reply to the UI history and save
          try {
            // Map all generated messages (assistant + tool) from the run
            const newMessages = event.response.messages.map((msg) => ({
              id: `msg-asst-${Date.now()}-${Math.random()}`,
              role: msg.role, // 'assistant' or 'tool'
              parts: (msg.content || []).map((c: any) => ({
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
              { accountId: parsedUserId },
              event.usage
                ? {
                    promptTokens: event.usage.inputTokens || 0,
                    completionTokens: event.usage.outputTokens || 0,
                    totalTokens: event.usage.totalTokens || 0
                  }
                : undefined
            )
          } catch (e) {
            console.error('[AI Chat] Failed to save session on finish:', e)
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
      console.error('[AI Chat] Error:', error)
      if (!reply.raw.headersSent) {
        reply.status(500).send({ error: 'Failed to process AI chat request' })
      } else {
        reply.raw.end()
      }
    }
  }
}

export const aiChatService = new AiChatService()
