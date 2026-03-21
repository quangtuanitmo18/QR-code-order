import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { ChatRequestBody, chatRequestSchema, executeActionSchema } from '@/schemaValidations/ai-chat.schema'
import { adminAiChatService } from '@/services/admin-ai-chat.service'
import { adminService } from '@/services/admin.service'
import { getContextLogger } from '@/utils/logger'
import { FastifyInstance } from 'fastify'

export async function adminAiChatController(fastify: FastifyInstance) {
  fastify.post(
    '/',
    {
      schema: {
        body: chatRequestSchema
      },
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute'
        }
      },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const { messages, sessionId } = request.body as ChatRequestBody
      const token = request.decodedAccessToken
      const accountId = token?.userId

      if (!accountId) {
        reply.status(401).send({ error: 'Unauthorized' })
        return
      }

      // Handle streaming response — reply.hijack() is called inside the service
      await adminAiChatService.handleChat(messages, accountId, sessionId, reply)
    }
  )

  /**
   * HITL Execute Action endpoint.
   * Called directly by the frontend when admin approves a mutation (cancel order, update dish).
   */
  fastify.post(
    '/execute-action',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const log = getContextLogger()
      const token = request.decodedAccessToken
      const accountId = token?.userId

      if (!accountId) {
        reply.status(401).send({ error: 'Unauthorized' })
        return
      }

      const { action, params } = executeActionSchema.parse(request.body)

      try {
        let result: any
        if (action === 'admin_cancel_order') {
          if (!params.orderId) {
            reply.status(400).send({ error: 'orderId is required for cancel_order' })
            return
          }
          result = await adminService.cancelOrder(params.orderId, params.reason || 'Admin action')
        } else if (action === 'admin_update_dish') {
          if (!params.dishId || !params.updates) {
            reply.status(400).send({ error: 'dishId and updates are required for update_dish' })
            return
          }
          result = await adminService.updateDish(params.dishId, params.updates)
        } else {
          reply.status(400).send({ error: `Unknown action: ${action}` })
          return
        }

        log?.info({ action, params, result }, '[Admin AI HITL] Action executed successfully')
        reply.send({ success: true, result })
      } catch (error: any) {
        log?.error({ err: error, action, params }, '[Admin AI HITL] Action execution failed')
        reply.status(500).send({ error: error.message || 'Action execution failed' })
      }
    }
  )
}
