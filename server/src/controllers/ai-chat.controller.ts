import { ChatRequestBody, chatRequestSchema } from '@/schemaValidations/ai-chat.schema'
import { aiChatService } from '@/services/ai-chat.service'
import { FastifyInstance } from 'fastify'

export async function aiChatController(fastify: FastifyInstance) {
  fastify.post(
    '/',
    {
      schema: {
        body: chatRequestSchema
      }
      // TODO: Bật lại auth sau khi test xong
      // preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const { messages } = request.body as ChatRequestBody
      const userId = request.decodedAccessToken?.userId?.toString() || 'guest'

      // Handle string streaming internally
      await aiChatService.handleChat(messages, userId, reply)
    }
  )
}
