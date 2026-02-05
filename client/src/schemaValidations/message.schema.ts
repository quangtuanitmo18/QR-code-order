import { z } from 'zod'

// Message Attachment Schema (for responses - dates as ISO strings)
export const MessageAttachmentSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  createdAt: z.string(), // ISO date string
  fileUrl: z.string(),
})

export type MessageAttachmentType = z.TypeOf<typeof MessageAttachmentSchema>

// Message Reaction Schema (for responses - dates as ISO strings)
export const MessageReactionSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  accountId: z.number(),
  emoji: z.string(),
  createdAt: z.string(), // ISO date string
  account: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
  }),
})

export type MessageReactionType = z.TypeOf<typeof MessageReactionSchema>

// Message Read Receipt Schema (for responses - dates as ISO strings)
export const MessageReadReceiptSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  accountId: z.number(),
  readAt: z.string(), // ISO date string
  account: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
  }),
})

export type MessageReadReceiptType = z.TypeOf<typeof MessageReadReceiptSchema>

// Message Schema (for responses - dates as ISO strings)
export const MessageSchema = z.object({
  id: z.number(),
  conversationId: z.number(),
  senderId: z.number(),
  content: z.string(),
  type: z.enum(['text', 'image', 'file']),
  replyToId: z.number().nullable(),
  isEdited: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  sender: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
  }),
  replyTo: z
    .object({
      id: z.number(),
      content: z.string(),
      senderId: z.number(),
      sender: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        avatar: z.string().nullable(),
      }),
    })
    .nullable()
    .optional(),
  attachments: z.array(MessageAttachmentSchema).optional(),
  reactions: z.array(MessageReactionSchema).optional(),
  readReceipts: z.array(MessageReadReceiptSchema).optional(),
})

export type MessageType = z.TypeOf<typeof MessageSchema>

// Get Messages Query Parameters
export const GetMessagesQueryParams = z.object({
  before: z.string().optional(), // ISO date string for cursor-based pagination
  limit: z.coerce.number().min(1).max(100).optional().default(50),
})

export type GetMessagesQueryParamsType = z.TypeOf<typeof GetMessagesQueryParams>

// Get Messages Response
export const GetMessagesRes = z.object({
  data: z.object({
    messages: z.array(MessageSchema),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(), // ISO date string
  }),
  message: z.string(),
})

export type GetMessagesResType = z.TypeOf<typeof GetMessagesRes>

// Get Message by ID Response
export const GetMessageRes = z.object({
  data: MessageSchema,
  message: z.string(),
})

export type GetMessageResType = z.TypeOf<typeof GetMessageRes>

// Create Message Body
export const CreateMessageBody = z
  .object({
    content: z.string().min(1).max(5000, 'Message content cannot exceed 5000 characters'),
    replyToId: z.number().int().optional().nullable(),
  })
  .strict()

export type CreateMessageBodyType = z.TypeOf<typeof CreateMessageBody>

// Create Message Response
export const CreateMessageRes = z.object({
  data: MessageSchema,
  message: z.string(),
})

export type CreateMessageResType = z.TypeOf<typeof CreateMessageRes>

// Update Message Body
export const UpdateMessageBody = z
  .object({
    content: z.string().min(1).max(5000, 'Message content cannot exceed 5000 characters'),
  })
  .strict()

export type UpdateMessageBodyType = z.TypeOf<typeof UpdateMessageBody>

// Update Message Response
export const UpdateMessageRes = z.object({
  data: MessageSchema,
  message: z.string(),
})

export type UpdateMessageResType = z.TypeOf<typeof UpdateMessageRes>

// Delete Message Response
export const DeleteMessageRes = z.object({
  message: z.string(),
})

export type DeleteMessageResType = z.TypeOf<typeof DeleteMessageRes>

// Mark Message As Read Response
export const MarkMessageAsReadRes = z.object({
  message: z.string(),
})

export type MarkMessageAsReadResType = z.TypeOf<typeof MarkMessageAsReadRes>

// Add Reaction Body
export const AddReactionBody = z
  .object({
    emoji: z.string().min(1).max(10, 'Emoji cannot exceed 10 characters'),
  })
  .strict()

export type AddReactionBodyType = z.TypeOf<typeof AddReactionBody>

// Add Reaction Response
export const AddReactionRes = z.object({
  data: MessageReactionSchema,
  message: z.string(),
})

export type AddReactionResType = z.TypeOf<typeof AddReactionRes>

// Remove Reaction Response
export const RemoveReactionRes = z.object({
  message: z.string(),
})

export type RemoveReactionResType = z.TypeOf<typeof RemoveReactionRes>

// Search Messages Query Parameters
export const SearchMessagesQueryParams = z.object({
  q: z.string().min(1, 'Search query cannot be empty'),
  conversationId: z.coerce.number().int().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
})

export type SearchMessagesQueryParamsType = z.TypeOf<typeof SearchMessagesQueryParams>

// Search Messages Response
export const SearchMessagesRes = z.object({
  data: z.object({
    messages: z.array(MessageSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
  message: z.string(),
})

export type SearchMessagesResType = z.TypeOf<typeof SearchMessagesRes>
