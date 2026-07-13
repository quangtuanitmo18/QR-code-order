import { z } from 'zod'

/** Schema for a single message part (text, tool-invocation, etc.) */
const messagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional()
  })
  .passthrough()

/** Schema for a single message in the chat request */
const messageSchema = z
  .object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().optional(),
    parts: z.array(messagePartSchema).optional()
  })
  .passthrough()

export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).max(50),
  sessionId: z.string().optional(),
  timeZone: z.string().optional()
})

export type ChatRequestBody = z.infer<typeof chatRequestSchema>

export const executeActionSchema = z.object({
  action: z.enum(['admin_cancel_order', 'admin_update_dish']),
  params: z.object({
    orderId: z.number().optional(),
    reason: z.string().optional(),
    dishId: z.number().optional(),
    updates: z
      .object({
        status: z.enum(['Available', 'Unavailable', 'Hidden']).optional(),
        price: z.number().optional()
      })
      .optional()
  })
})

export type ExecuteActionBody = z.infer<typeof executeActionSchema>

/** Schema for guest AI HITL execute-action request */
export const guestExecuteActionSchema = z.object({
  action: z.enum(['placeOrder', 'cancelOrder', 'applyCoupon']),
  toolCallId: z.string().max(200).optional(),
  params: z.object({
    items: z
      .array(
        z.object({
          dishId: z.number().int().positive(),
          dishName: z.string().max(200),
          quantity: z.number().int().min(1).max(99)
        })
      )
      .min(1)
      .max(20)
      .optional(),
    orderId: z.number().int().positive().optional(),
    couponCode: z.string().max(50).optional()
  })
})

export type GuestExecuteActionBody = z.infer<typeof guestExecuteActionSchema>

