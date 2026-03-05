import { z } from 'zod'

export const chatRequestSchema = z.object({
  messages: z.array(z.any()) // Allows standard AI SDK message format
})

export type ChatRequestBody = z.infer<typeof chatRequestSchema>
