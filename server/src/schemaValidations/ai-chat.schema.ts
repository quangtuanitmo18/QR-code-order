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
  sessionId: z.string().optional()
})

export type ChatRequestBody = z.infer<typeof chatRequestSchema>
