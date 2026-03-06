import prisma from '@/database'
import { requireGuestHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { ChatRequestBody, chatRequestSchema } from '@/schemaValidations/ai-chat.schema'
import { aiChatService } from '@/services/ai-chat.service'
import { FastifyInstance } from 'fastify'

export async function aiChatController(fastify: FastifyInstance) {
  fastify.post(
    '/',
    {
      schema: {
        body: chatRequestSchema
      },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const { messages, sessionId } = request.body as ChatRequestBody
      const userId = request.decodedAccessToken?.userId?.toString() || 'guest'

      // Handle streaming response — reply.hijack() is called inside the service
      await aiChatService.handleChat(messages, userId, sessionId, reply)
    }
  )

  fastify.get(
    '/admin/stats',
    {
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const stats = await prisma.aiChatSession.aggregate({
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true
        },
        _count: {
          id: true
        }
      })

      reply.send({
        message: 'Get AI token stats successfully',
        data: {
          totalSessions: stats._count.id,
          totalPromptTokens: stats._sum.promptTokens || 0,
          totalCompletionTokens: stats._sum.completionTokens || 0,
          totalTokens: stats._sum.totalTokens || 0
        }
      })
    }
  )
}
