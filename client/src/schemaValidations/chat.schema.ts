import { z } from 'zod'

// Conversation Participant Schema (for responses - dates as ISO strings)
export const ConversationParticipantSchema = z.object({
  id: z.number(),
  conversationId: z.number(),
  accountId: z.number(),
  isMuted: z.boolean(),
  lastReadAt: z.string().nullable(), // ISO date string
  joinedAt: z.string(), // ISO date string
  account: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
    role: z.string(),
  }),
})

export type ConversationParticipantType = z.TypeOf<typeof ConversationParticipantSchema>

// Last Message Schema (for conversation preview)
export const LastMessageSchema = z
  .object({
    id: z.number(),
    content: z.string(),
    createdAt: z.string(), // ISO date string
    senderId: z.number(),
    sender: z.object({
      id: z.number(),
      name: z.string(),
    }),
  })
  .nullable()
  .optional()

export type LastMessageType = z.TypeOf<typeof LastMessageSchema>

// Conversation Schema (for responses - dates as ISO strings)
export const ConversationSchema = z.object({
  id: z.number(),
  type: z.enum(['direct', 'group']),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  createdById: z.number(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  createdBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
  }),
  participants: z.array(ConversationParticipantSchema),
  pinnedBy: z
    .array(
      z.object({
        id: z.number(),
        pinnedAt: z.string(), // ISO date string
      })
    )
    .optional(),
  messages: z
    .array(
      z.object({
        id: z.number(),
        content: z.string(),
        createdAt: z.string(),
        senderId: z.number(),
        sender: z.object({
          id: z.number(),
          name: z.string(),
        }),
      })
    )
    .optional(),
  unreadCount: z.number().optional().default(0),
})

export type ConversationType = z.TypeOf<typeof ConversationSchema>

// Get Conversations Query Parameters
export const GetConversationsQueryParams = z.object({
  type: z.enum(['direct', 'group']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.enum(['updatedAt', 'createdAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type GetConversationsQueryParamsType = z.TypeOf<typeof GetConversationsQueryParams>

// Get Conversations Response
export const GetConversationsRes = z.object({
  data: z.object({
    conversations: z.array(ConversationSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
  message: z.string(),
})

export type GetConversationsResType = z.TypeOf<typeof GetConversationsRes>

// Get Conversation by ID Response
export const GetConversationRes = z.object({
  data: ConversationSchema,
  message: z.string(),
})

export type GetConversationResType = z.TypeOf<typeof GetConversationRes>

// Create Conversation Body
export const CreateConversationBody = z
  .object({
    type: z.enum(['direct', 'group']),
    name: z.string().min(1).max(100).optional().nullable(),
    avatar: z.string().optional().nullable(),
    participantIds: z.array(z.coerce.number()).min(1),
  })
  .strict()

export type CreateConversationBodyType = z.TypeOf<typeof CreateConversationBody>

// Create Conversation Response
export const CreateConversationRes = z.object({
  data: ConversationSchema,
  message: z.string(),
})

export type CreateConversationResType = z.TypeOf<typeof CreateConversationRes>

// Update Conversation Body
export const UpdateConversationBody = z
  .object({
    name: z.string().min(1).max(100).optional().nullable(),
    avatar: z.string().optional().nullable(),
  })
  .strict()

export type UpdateConversationBodyType = z.TypeOf<typeof UpdateConversationBody>

// Update Conversation Response
export const UpdateConversationRes = z.object({
  data: ConversationSchema,
  message: z.string(),
})

export type UpdateConversationResType = z.TypeOf<typeof UpdateConversationRes>

// Delete Conversation Response
export const DeleteConversationRes = z.object({
  message: z.string(),
})

export type DeleteConversationResType = z.TypeOf<typeof DeleteConversationRes>

// Add Participants Body
export const AddParticipantsBody = z
  .object({
    participantIds: z.array(z.coerce.number()).min(1),
  })
  .strict()

export type AddParticipantsBodyType = z.TypeOf<typeof AddParticipantsBody>

// Add Participants Response
export const AddParticipantsRes = z.object({
  data: ConversationSchema,
  message: z.string(),
})

export type AddParticipantsResType = z.TypeOf<typeof AddParticipantsRes>

// Remove Participant Response
export const RemoveParticipantRes = z.object({
  message: z.string(),
})

export type RemoveParticipantResType = z.TypeOf<typeof RemoveParticipantRes>

// Pin/Unpin Conversation Response
export const PinConversationRes = z.object({
  message: z.string(),
})

export type PinConversationResType = z.TypeOf<typeof PinConversationRes>

// Mute/Unmute Conversation Response
export const MuteConversationRes = z.object({
  message: z.string(),
})

export type MuteConversationResType = z.TypeOf<typeof MuteConversationRes>
