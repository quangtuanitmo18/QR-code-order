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
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook], { relation: 'or' })
    },
    async (request, reply) => {
      const { messages, sessionId } = request.body as ChatRequestBody
      const token = request.decodedAccessToken
      // For guests, the guest ID is stored in userId with role='Guest'
      const isGuest = token?.role === 'Guest'
      const guestId = isGuest ? token?.userId : undefined
      const userId = isGuest ? 'guest' : token?.userId?.toString() || 'guest'

      // Handle streaming response — reply.hijack() is called inside the service
      await aiChatService.handleChat(messages, userId, sessionId, reply, guestId)
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
