import { z } from 'zod'

// Task Comment Schema (for responses)
export const TaskCommentSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  content: z.string(),
  createdById: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
})

export type TaskCommentType = z.TypeOf<typeof TaskCommentSchema>

// Get Comments Response
export const GetCommentsRes = z.object({
  data: z.array(TaskCommentSchema),
  message: z.string(),
})

export type GetCommentsResType = z.TypeOf<typeof GetCommentsRes>

// Create Comment Body
export const CreateCommentBody = z
  .object({
    content: z.string().min(1).max(5000),
  })
  .strict()

export type CreateCommentBodyType = z.TypeOf<typeof CreateCommentBody>

// Create Comment Response
export const CreateCommentRes = z.object({
  data: TaskCommentSchema,
  message: z.string(),
})

export type CreateCommentResType = z.TypeOf<typeof CreateCommentRes>

// Update Comment Body
export const UpdateCommentBody = z
  .object({
    content: z.string().min(1).max(5000),
  })
  .strict()

export type UpdateCommentBodyType = z.TypeOf<typeof UpdateCommentBody>

// Update Comment Response
export const UpdateCommentRes = z.object({
  data: TaskCommentSchema,
  message: z.string(),
})

export type UpdateCommentResType = z.TypeOf<typeof UpdateCommentRes>

// Delete Comment Response
export const DeleteCommentRes = z.object({
  message: z.string(),
})

export type DeleteCommentResType = z.TypeOf<typeof DeleteCommentRes>
