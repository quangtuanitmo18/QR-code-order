import envConfig from '@/config'
import { promptBuilderService } from '@/services/prompt-builder.service'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

// Convert UIMessage format (parts) to ModelMessage format (content)
function convertToModelMessages(messages: any[]): any[] {
  return messages.map((msg) => {
    if (msg.content !== undefined) {
      return { role: msg.role, content: msg.content }
    }
    if (msg.parts) {
      const text = msg.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('')
      return { role: msg.role, content: text }
    }
    return { role: msg.role, content: '' }
  })
}

class AiChatService {
  private openrouter = createOpenRouter({
    apiKey: envConfig.OPENROUTER_API_KEY
  })

  async handleChat(messages: any[], userId: string, reply: any) {
    try {
      const systemPrompt = await promptBuilderService.buildSystemPrompt(userId)
      const modelMessages = convertToModelMessages(messages)

      console.log('[AI Chat] Calling generateText...')

      const result = await generateText({
        model: this.openrouter.chat('google/gemini-2.5-flash'),
        system: systemPrompt,
        messages: modelMessages,
        providerOptions: {
          openrouter: {
            max_tokens: 2048
          }
        }
      })

      console.log('[AI Chat] Got response:', result.text?.substring(0, 100))

      // Format as AI SDK Data Stream Protocol
      const chunks: string[] = []
      if (result.text) {
        chunks.push(`0:${JSON.stringify(result.text)}\n`)
      }
      chunks.push(
        `e:${JSON.stringify({
          finishReason: result.finishReason || 'stop',
          usage: { promptTokens: 0, completionTokens: 0 }
        })}\n`
      )
      chunks.push(`d:${JSON.stringify({ finishReason: result.finishReason || 'stop' })}\n`)

      reply.raw.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1'
      })
      reply.raw.end(chunks.join(''))
    } catch (error: any) {
      console.error('[AI Chat] Full error:', error)
      if (!reply.raw.headersSent) {
        reply.status(500).send({ error: 'Failed to process AI chat request' })
      }
    }
  }
}

export const aiChatService = new AiChatService()
