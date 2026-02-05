import { z } from 'zod'

// Message Attachment Schema (for responses)
export const MessageAttachmentSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  createdAt: z.date(),
  fileUrl: z.string()
})

export type MessageAttachmentType = z.TypeOf<typeof MessageAttachmentSchema>

// Message Reaction Schema (for responses)
export const MessageReactionSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  accountId: z.number(),
  emoji: z.string(),
  createdAt: z.date(),
  account: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable()
  })
})

export type MessageReactionType = z.TypeOf<typeof MessageReactionSchema>

// Message Read Receipt Schema (for responses)
export const MessageReadReceiptSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  accountId: z.number(),
  readAt: z.date(),
  account: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable()
  })
})

export type MessageReadReceiptType = z.TypeOf<typeof MessageReadReceiptSchema>

// Message Schema (for responses)
export const MessageSchema = z.object({
  id: z.number(),
  conversationId: z.number(),
  senderId: z.number(),
  content: z.string(),
  type: z.enum(['text', 'image', 'file']),
  replyToId: z.number().nullable(),
  isEdited: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sender: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable()
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
        avatar: z.string().nullable()
      })
    })
    .nullable()
    .optional(),
  attachments: z.array(MessageAttachmentSchema).optional(),
  reactions: z.array(MessageReactionSchema).optional(),
  readReceipts: z.array(MessageReadReceiptSchema).optional()
})

export type MessageType = z.TypeOf<typeof MessageSchema>

// Get Messages Query Parameters
export const GetMessagesQueryParams = z.object({
  before: z.coerce.date().optional(), // Cursor for pagination
  limit: z.coerce.number().min(1).max(100).optional().default(50)
})

export type GetMessagesQueryParamsType = z.TypeOf<typeof GetMessagesQueryParams>

// Get Messages Response
export const GetMessagesRes = z.object({
  data: z.object({
    messages: z.array(MessageSchema),
    hasMore: z.boolean(),
    nextCursor: z.date().optional()
  }),
  message: z.string()
})

export type GetMessagesResType = z.TypeOf<typeof GetMessagesRes>

// Conversation ID Param (for messages route)
export const ConversationIdParamForMessages = z.object({
  conversationId: z.coerce.number()
})

export type ConversationIdParamForMessagesType = z.TypeOf<typeof ConversationIdParamForMessages>

// Create Message Body
export const CreateMessageBody = z
  .object({
    content: z.string().min(1).max(5000), // Max 5000 characters, plain text only
    replyToId: z.coerce.number().optional().nullable()
  })
  .strict()

export type CreateMessageBodyType = z.TypeOf<typeof CreateMessageBody>

// Create Message Response
export const CreateMessageRes = z.object({
  data: MessageSchema,
  message: z.string()
})

export type CreateMessageResType = z.TypeOf<typeof CreateMessageRes>

// Update Message Body
export const UpdateMessageBody = z
  .object({
    content: z.string().min(1).max(5000) // Max 5000 characters, plain text only
  })
  .strict()

export type UpdateMessageBodyType = z.TypeOf<typeof UpdateMessageBody>

// Update Message Response
export const UpdateMessageRes = z.object({
  data: MessageSchema,
  message: z.string()
})

export type UpdateMessageResType = z.TypeOf<typeof UpdateMessageRes>

// Delete Message Response
export const DeleteMessageRes = z.object({
  message: z.string()
})

export type DeleteMessageResType = z.TypeOf<typeof DeleteMessageRes>

// Message ID Param
export const MessageIdParam = z.object({
  id: z.coerce.number()
})

export type MessageIdParamType = z.TypeOf<typeof MessageIdParam>

// Mark Message as Read Response
export const MarkMessageAsReadRes = z.object({
  message: z.string()
})

export type MarkMessageAsReadResType = z.TypeOf<typeof MarkMessageAsReadRes>

// Add Reaction Body
export const AddReactionBody = z
  .object({
    emoji: z.string().min(1).max(10) // Single emoji or shortcode
  })
  .strict()

export type AddReactionBodyType = z.TypeOf<typeof AddReactionBody>

// Add Reaction Response
export const AddReactionRes = z.object({
  data: MessageReactionSchema,
  message: z.string()
})

export type AddReactionResType = z.TypeOf<typeof AddReactionRes>

// Remove Reaction Response
export const RemoveReactionRes = z.object({
  message: z.string()
})

export type RemoveReactionResType = z.TypeOf<typeof RemoveReactionRes>

// Emoji Param (for removing reaction)
export const EmojiParam = z.object({
  emoji: z.string()
})

export type EmojiParamType = z.TypeOf<typeof EmojiParam>

// Search Messages Query Parameters
export const SearchMessagesQueryParams = z.object({
  q: z.string().min(1), // Search query
  conversationId: z.coerce.number().optional(), // Optional: limit to specific conversation
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20)
})

export type SearchMessagesQueryParamsType = z.TypeOf<typeof SearchMessagesQueryParams>

// Search Messages Response
export const SearchMessagesRes = z.object({
  data: z.object({
    messages: z.array(
      MessageSchema.extend({
        conversation: z.object({
          id: z.number(),
          type: z.enum(['direct', 'group']),
          name: z.string().nullable()
        })
      })
    ),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number()
    })
  }),
  message: z.string()
})

export type SearchMessagesResType = z.TypeOf<typeof SearchMessagesRes>
