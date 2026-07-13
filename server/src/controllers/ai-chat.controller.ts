import prisma from '@/database'
import { requireGuestHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { ChatRequestBody, chatRequestSchema, guestExecuteActionSchema } from '@/schemaValidations/ai-chat.schema'
import { aiChatService } from '@/services/ai-chat.service'
import { guestService } from '@/services/guest.service'
import { couponService } from '@/services/coupon.service'
import { getContextLogger } from '@/utils/logger'
import { FastifyInstance } from 'fastify'

/** In-memory idempotency cache for HITL actions (prevents double-click duplicates) */
const hitlIdempotencyCache = new Map<string, any>()

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
      const { messages, sessionId, timeZone } = request.body as ChatRequestBody
      const token = request.decodedAccessToken
      // For guests, the guest ID is stored in userId with role='Guest'
      const isGuest = token?.role === 'Guest'
      const guestId = isGuest ? token?.userId : undefined
      const userId = isGuest ? 'guest' : token?.userId?.toString() || 'guest'

      // Handle streaming response — reply.hijack() is called inside the service
      await aiChatService.handleChat(messages, userId, sessionId, reply, guestId, timeZone)
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

      // Validate request body with Zod schema
      const parseResult = guestExecuteActionSchema.safeParse(request.body)
      if (!parseResult.success) {
        reply.status(400).send({ error: 'Invalid request', details: parseResult.error.issues })
        return
      }

      const { action, params, toolCallId } = parseResult.data

      // Idempotency check: prevent double-click duplicate orders
      if (toolCallId) {
        const idempotencyKey = `hitl:${guestId}:${toolCallId}`
        if (hitlIdempotencyCache.has(idempotencyKey)) {
          log?.info({ toolCallId }, '[Guest AI HITL] Duplicate request detected, returning cached result')
          reply.send(hitlIdempotencyCache.get(idempotencyKey))
          return
        }
        // Mark as in-progress to block concurrent duplicates
        hitlIdempotencyCache.set(idempotencyKey, { success: true, result: { message: 'Processing...' } })
        // Auto-expire after 5 minutes
        setTimeout(() => hitlIdempotencyCache.delete(idempotencyKey), 5 * 60 * 1000)
      }

      try {
        let result: any

        if (action === 'placeOrder') {
          const items = params.items
          if (!items || items.length === 0) {
            reply.status(400).send({ error: 'Items are required for placing an order.' })
            return
          }
          result = await guestService.placeOrderById(guestId, items)
        } else if (action === 'cancelOrder') {
          if (!params.orderId) {
            reply.status(400).send({ error: 'Order ID is required for cancellation.' })
            return
          }
          result = await guestService.cancelOrder(params.orderId, guestId)
          result = { message: `Order #${params.orderId} has been cancelled successfully.`, ...result }
        } else if (action === 'applyCoupon') {
          if (!params.couponCode || !params.orderId) {
            reply.status(400).send({ error: 'Coupon code and order ID are required.' })
            return
          }
          result = await couponService.applyToOrder(params.couponCode, params.orderId, guestId)
          result = { message: `Coupon "${params.couponCode}" applied successfully! 🎉`, ...result }
        }

        const response = { success: true, result }

        // Cache result for idempotency
        if (toolCallId) {
          hitlIdempotencyCache.set(`hitl:${guestId}:${toolCallId}`, response)
        }

        log?.info({ action, params, result }, '[Guest AI HITL] Action executed successfully')
        reply.send(response)
      } catch (error: any) {
        // Clear idempotency cache on error so user can retry
        if (toolCallId) {
          hitlIdempotencyCache.delete(`hitl:${guestId}:${toolCallId}`)
        }
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
