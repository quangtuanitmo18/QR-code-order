import { z } from 'zod'

// Task Attachment Schema (for responses)
export const TaskAttachmentSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  uploadedById: z.number(),
  createdAt: z.date(),
  uploadedBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  fileUrl: z.string(),
})

export type TaskAttachmentType = z.TypeOf<typeof TaskAttachmentSchema>

// Get Attachments Response
export const GetAttachmentsRes = z.object({
  data: z.array(TaskAttachmentSchema),
  message: z.string(),
})

export type GetAttachmentsResType = z.TypeOf<typeof GetAttachmentsRes>

// Delete Attachment Response
export const DeleteAttachmentRes = z.object({
  message: z.string(),
})

export type DeleteAttachmentResType = z.TypeOf<typeof DeleteAttachmentRes>
