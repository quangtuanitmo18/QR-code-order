import { z } from 'zod'

export const chatRequestSchema = z.object({
  messages: z.array(z.any()).max(50), // Allows standard AI SDK message format, max 50 to prevent overflow
  sessionId: z.string().optional()
})

export type ChatRequestBody = z.infer<typeof chatRequestSchema>
