import prisma from '@/database'
import { requireGuestHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { ChatRequestBody, chatRequestSchema } from '@/schemaValidations/ai-chat.schema'
import { aiChatService } from '@/services/ai-chat.service'
import { guestService } from '@/services/guest.service'
import { couponService } from '@/services/coupon.service'
import { getContextLogger } from '@/utils/logger'
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

  /**
   * HITL Execute Action endpoint for Guest AI.
   * Called directly by the frontend when guest confirms a mutation (place order, cancel order).
   */
  fastify.post(
    '/execute-action',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute'
        }
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook], { relation: 'or' })
    },
    async (request, reply) => {
      const log = getContextLogger()
      const token = request.decodedAccessToken
      const isGuest = token?.role === 'Guest'
      const guestId = isGuest ? token?.userId : undefined

      if (!guestId) {
        reply.status(401).send({ error: 'Guest session required. Please scan QR code again.' })
        return
      }

      const { action, params } = request.body as { action: string; params: Record<string, any> }

      try {
        let result: any

        if (action === 'placeOrder') {
          const items = params.items as Array<{ dishId: number; dishName: string; quantity: number }>
          result = await guestService.placeOrderById(guestId, items)

        } else if (action === 'cancelOrder') {
          result = await guestService.cancelOrder(params.orderId, guestId)
          result = { message: `Order #${params.orderId} has been cancelled successfully.`, ...result }
        } else if (action === 'applyCoupon') {
          result = await couponService.applyToOrder(params.couponCode, params.orderId, guestId)
          result = { message: `Coupon "${params.couponCode}" applied successfully! 🎉`, ...result }
        } else {
          reply.status(400).send({ error: `Unknown action: ${action}` })
          return
        }

        log?.info({ action, params, result }, '[Guest AI HITL] Action executed successfully')
        reply.send({ success: true, result })
      } catch (error: any) {
        log?.error({ err: error, action, params }, '[Guest AI HITL] Action execution failed')
        reply.status(500).send({ error: error.message || 'Action execution failed' })
      }
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
