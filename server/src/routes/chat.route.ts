import {
  addParticipantsController,
  createConversationController,
  deleteConversationController,
  getConversationByIdController,
  getConversationsController,
  muteConversationController,
  pinConversationController,
  removeParticipantController,
  unmuteConversationController,
  unpinConversationController,
  updateConversationController
} from '@/controllers/chat.controller'
import {
  addReactionController,
  deleteMessageController,
  editMessageController,
  getMessageByIdController,
  getMessagesController,
  markMessageAsReadController,
  removeReactionController,
  searchMessagesController,
  sendMessageController
} from '@/controllers/message.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import {
  emitMessageDeleted,
  emitMessageUpdated,
  emitNewMessage,
  emitReactionAdded,
  emitReactionRemoved,
  emitReadReceipt
} from '@/plugins/chat.socket'
import {
  AccountIdParam,
  AccountIdParamType,
  AddParticipantsBody,
  AddParticipantsBodyType,
  AddParticipantsRes,
  AddParticipantsResType,
  ConversationIdParam,
  ConversationIdParamType,
  CreateConversationBody,
  CreateConversationBodyType,
  CreateConversationRes,
  CreateConversationResType,
  DeleteConversationRes,
  DeleteConversationResType,
  GetConversationRes,
  GetConversationResType,
  GetConversationsQueryParams,
  GetConversationsQueryParamsType,
  GetConversationsRes,
  GetConversationsResType,
  MuteConversationRes,
  MuteConversationResType,
  PinConversationRes,
  PinConversationResType,
  RemoveParticipantRes,
  RemoveParticipantResType,
  UpdateConversationBody,
  UpdateConversationBodyType,
  UpdateConversationRes,
  UpdateConversationResType
} from '@/schemaValidations/chat.schema'
import {
  AddReactionBody,
  AddReactionBodyType,
  AddReactionRes,
  AddReactionResType,
  ConversationIdParamForMessages,
  ConversationIdParamForMessagesType,
  CreateMessageRes,
  CreateMessageResType,
  DeleteMessageRes,
  DeleteMessageResType,
  EmojiParam,
  EmojiParamType,
  GetMessagesQueryParams,
  GetMessagesQueryParamsType,
  GetMessagesRes,
  GetMessagesResType,
  MarkMessageAsReadRes,
  MarkMessageAsReadResType,
  MessageIdParam,
  MessageIdParamType,
  RemoveReactionRes,
  RemoveReactionResType,
  SearchMessagesQueryParams,
  SearchMessagesQueryParamsType,
  SearchMessagesRes,
  SearchMessagesResType,
  UpdateMessageBody,
  UpdateMessageBodyType,
  UpdateMessageRes,
  UpdateMessageResType
} from '@/schemaValidations/message.schema'
import { EntityError } from '@/utils/errors'
import fastifyMultipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function chatRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Register multipart plugin for file uploads
  fastify.register(fastifyMultipart)

  // All routes require authentication
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook]))

  // ==================== CONVERSATION ROUTES ====================

  // Get all conversations for current user
  fastify.get<{ Reply: GetConversationsResType; Querystring: GetConversationsQueryParamsType }>(
    '/conversations',
    {
      schema: {
        response: {
          200: GetConversationsRes
        },
        querystring: GetConversationsQueryParams
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const result = await getConversationsController(accountId, request.query)
      reply.send({
        message: 'Get conversations successfully',
        data: result as GetConversationsResType['data']
      })
    }
  )

  // Get conversation by ID
  fastify.get<{ Reply: GetConversationResType; Params: ConversationIdParamType }>(
    '/conversations/:id',
    {
      schema: {
        response: {
          200: GetConversationRes
        },
        params: ConversationIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const result = await getConversationByIdController(request.params.id, accountId)
      reply.send({
        message: 'Get conversation successfully',
        data: result as GetConversationResType['data']
      })
    }
  )

  // Create conversation
  fastify.post<{ Reply: CreateConversationResType; Body: CreateConversationBodyType }>(
    '/conversations',
    {
      schema: {
        response: {
          200: CreateConversationRes
        },
        body: CreateConversationBody
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const role = request.decodedAccessToken?.role as string
      const result = await createConversationController(accountId, role, request.body)
      reply.send({
        message: 'Create conversation successfully',
        data: result as CreateConversationResType['data']
      })
    }
  )

  // Update conversation
  fastify.put<{ Reply: UpdateConversationResType; Params: ConversationIdParamType; Body: UpdateConversationBodyType }>(
    '/conversations/:id',
    {
      schema: {
        response: {
          200: UpdateConversationRes
        },
        params: ConversationIdParam,
        body: UpdateConversationBody
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const result = await updateConversationController(request.params.id, accountId, request.body)
      reply.send({
        message: 'Update conversation successfully',
        data: result as UpdateConversationResType['data']
      })
    }
  )

  // Delete/leave conversation
  fastify.delete<{ Reply: DeleteConversationResType; Params: ConversationIdParamType }>(
    '/conversations/:id',
    {
      schema: {
        response: {
          200: DeleteConversationRes
        },
        params: ConversationIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      await deleteConversationController(request.params.id, accountId)
      reply.send({
        message: 'Delete conversation successfully'
      })
    }
  )

  // Add participants to group chat
  fastify.post<{
    Reply: AddParticipantsResType
    Params: ConversationIdParamType
    Body: AddParticipantsBodyType
  }>(
    '/conversations/:id/participants',
    {
      schema: {
        response: {
          200: AddParticipantsRes
        },
        params: ConversationIdParam,
        body: AddParticipantsBody
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const result = await addParticipantsController(request.params.id, accountId, request.body)
      reply.send({
        message: 'Add participants successfully',
        data: result as AddParticipantsResType['data']
      })
    }
  )

  // Remove participant from group chat
  fastify.delete<{ Reply: RemoveParticipantResType; Params: ConversationIdParamType & AccountIdParamType }>(
    '/conversations/:id/participants/:accountId',
    {
      schema: {
        response: {
          200: RemoveParticipantRes
        },
        params: ConversationIdParam.merge(AccountIdParam)
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      await removeParticipantController(request.params.id, accountId, request.params.accountId)
      reply.send({
        message: 'Remove participant successfully'
      })
    }
  )

  // Pin conversation
  fastify.post<{ Reply: PinConversationResType; Params: ConversationIdParamType }>(
    '/conversations/:id/pin',
    {
      schema: {
        response: {
          200: PinConversationRes
        },
        params: ConversationIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      await pinConversationController(request.params.id, accountId)
      reply.send({
        message: 'Pin conversation successfully'
      })
    }
  )

  // Unpin conversation
  fastify.delete<{ Reply: PinConversationResType; Params: ConversationIdParamType }>(
    '/conversations/:id/pin',
    {
      schema: {
        response: {
          200: PinConversationRes
        },
        params: ConversationIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      await unpinConversationController(request.params.id, accountId)
      reply.send({
        message: 'Unpin conversation successfully'
      })
    }
  )

  // Mute conversation
  fastify.post<{ Reply: MuteConversationResType; Params: ConversationIdParamType }>(
    '/conversations/:id/mute',
    {
      schema: {
        response: {
          200: MuteConversationRes
        },
        params: ConversationIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      await muteConversationController(request.params.id, accountId)
      reply.send({
        message: 'Mute conversation successfully'
      })
    }
  )

  // Unmute conversation
  fastify.delete<{ Reply: MuteConversationResType; Params: ConversationIdParamType }>(
    '/conversations/:id/mute',
    {
      schema: {
        response: {
          200: MuteConversationRes
        },
        params: ConversationIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      await unmuteConversationController(request.params.id, accountId)
      reply.send({
        message: 'Unmute conversation successfully'
      })
    }
  )

  // ==================== MESSAGE ROUTES ====================

  // Get messages for conversation
  fastify.get<{
    Reply: GetMessagesResType
    Params: ConversationIdParamForMessagesType
    Querystring: GetMessagesQueryParamsType
  }>(
    '/conversations/:conversationId/messages',
    {
      schema: {
        response: {
          200: GetMessagesRes
        },
        params: ConversationIdParamForMessages,
        querystring: GetMessagesQueryParams
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const result = await getMessagesController(request.params.conversationId, accountId, request.query)
      reply.send({
        message: 'Get messages successfully',
        data: result as GetMessagesResType['data']
      })
    }
  )

  // Send new message (with rate limiting: 10 messages/second per user)
  // Register rate limiting for this specific route using nested route
  await fastify.register(
    async function messageRateLimitRoutes(fastify: FastifyInstance) {
      await fastify.register(rateLimit, {
        max: 10, // Maximum 10 requests
        timeWindow: 1000, // Per 1 second (1000ms)
        keyGenerator: (request) => {
          // Use userId from JWT token as the key for per-user rate limiting
          const accountId = (request as any).decodedAccessToken?.userId as number
          return accountId?.toString() || request.ip
        },
        errorResponseBuilder: (request, context) => {
          return {
            message: 'Too many messages. Please slow down. Maximum 10 messages per second.',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(context.ttl / 1000) // Time until next request allowed (in seconds)
          }
        },
        skipOnError: false
      })

      fastify.post<{
        Reply: CreateMessageResType
        Params: ConversationIdParamForMessagesType
      }>(
        '/conversations/:conversationId/messages',
        {
          schema: {
            response: {
              200: CreateMessageRes
            },
            params: ConversationIdParamForMessages
            // Note: body schema validation is skipped for multipart/form-data
            // We'll validate manually in the handler
          }
        },
        async (request, reply) => {
          const accountId = request.decodedAccessToken?.userId as number

          // Parse multipart form data
          const parts = request.parts()
          let content: string | undefined
          let replyToId: number | undefined
          const files: any[] = []

          for await (const part of parts) {
            if (part.type === 'field') {
              if (part.fieldname === 'content') {
                content = part.value as string
              } else if (part.fieldname === 'replyToId') {
                const value = part.value as string
                if (value) {
                  const parsed = parseInt(value, 10)
                  // Validate: must be a valid positive number
                  if (!isNaN(parsed) && parsed > 0) {
                    replyToId = parsed
                  }
                  // Silently ignore invalid values (treat as no reply)
                }
              }
            } else if (part.type === 'file') {
              files.push(part)
            }
          }

          // Validate content: either content or files (or both) must be provided
          if ((!content || content.trim().length === 0) && (!files || files.length === 0)) {
            throw new EntityError([{ field: 'content', message: 'Message content or file attachment is required' }])
          }

          // Validate content length if content is provided
          if (content && content.length > 5000) {
            throw new EntityError([{ field: 'content', message: 'Message content cannot exceed 5000 characters' }])
          }

          // Call controller with file support
          const result = await sendMessageController(
            request.params.conversationId,
            accountId,
            {
              content: content || '', // Ensure content is always a string
              replyToId: replyToId || null
            },
            files
          )

          // Emit WebSocket event for new message
          emitNewMessage(fastify, request.params.conversationId, result)

          reply.send({
            message: 'Send message successfully',
            data: result as CreateMessageResType['data']
          })
        }
      )
    },
    { prefix: '' }
  )

  // Edit message
  fastify.put<{ Reply: UpdateMessageResType; Params: MessageIdParamType; Body: UpdateMessageBodyType }>(
    '/messages/:id',
    {
      schema: {
        response: {
          200: UpdateMessageRes
        },
        params: MessageIdParam,
        body: UpdateMessageBody
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const result = await editMessageController(request.params.id, accountId, request.body)

      // Emit WebSocket event for message updated
      if (result) {
        emitMessageUpdated(fastify, result.conversationId, result)
      }

      reply.send({
        message: 'Edit message successfully',
        data: result as UpdateMessageResType['data']
      })
    }
  )

  // Delete message
  fastify.delete<{ Reply: DeleteMessageResType; Params: MessageIdParamType }>(
    '/messages/:id',
    {
      schema: {
        response: {
          200: DeleteMessageRes
        },
        params: MessageIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      // Get message before deleting to get conversationId
      const message = await getMessageByIdController(request.params.id, accountId)
      await deleteMessageController(request.params.id, accountId)

      // Emit WebSocket event for message deleted
      if (message) {
        emitMessageDeleted(fastify, message.conversationId, request.params.id)
      }

      reply.send({
        message: 'Delete message successfully'
      })
    }
  )

  // Mark message as read
  fastify.post<{ Reply: MarkMessageAsReadResType; Params: MessageIdParamType }>(
    '/messages/:id/read',
    {
      schema: {
        response: {
          200: MarkMessageAsReadRes
        },
        params: MessageIdParam
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      // Get message to get conversationId
      const message = await getMessageByIdController(request.params.id, accountId)
      await markMessageAsReadController(request.params.id, accountId)

      // Emit WebSocket event for read receipt
      if (message) {
        emitReadReceipt(fastify, message.conversationId, request.params.id, accountId)
      }

      reply.send({
        message: 'Mark message as read successfully'
      })
    }
  )

  // Add reaction to message
  fastify.post<{ Reply: AddReactionResType; Params: MessageIdParamType; Body: AddReactionBodyType }>(
    '/messages/:id/reactions',
    {
      schema: {
        response: {
          200: AddReactionRes
        },
        params: MessageIdParam,
        body: AddReactionBody
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      // Get message to get conversationId
      const message = await getMessageByIdController(request.params.id, accountId)
      const result = await addReactionController(request.params.id, accountId, request.body)

      // Emit WebSocket event for reaction added
      if (message && result) {
        emitReactionAdded(fastify, message.conversationId, request.params.id, result)
      }

      reply.send({
        message: 'Add reaction successfully',
        data: result as AddReactionResType['data']
      })
    }
  )

  // Remove reaction from message
  fastify.delete<{ Reply: RemoveReactionResType; Params: MessageIdParamType & EmojiParamType }>(
    '/messages/:id/reactions/:emoji',
    {
      schema: {
        response: {
          200: RemoveReactionRes
        },
        params: MessageIdParam.merge(EmojiParam)
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      // Get message to get conversationId
      const message = await getMessageByIdController(request.params.id, accountId)
      await removeReactionController(request.params.id, accountId, request.params.emoji)

      // Emit WebSocket event for reaction removed
      if (message) {
        emitReactionRemoved(fastify, message.conversationId, request.params.id, accountId, request.params.emoji)
      }

      reply.send({
        message: 'Remove reaction successfully'
      })
    }
  )

  // Search messages
  fastify.get<{ Reply: SearchMessagesResType; Querystring: SearchMessagesQueryParamsType }>(
    '/search',
    {
      schema: {
        response: {
          200: SearchMessagesRes
        },
        querystring: SearchMessagesQueryParams
      }
    },
    async (request, reply) => {
      const accountId = request.decodedAccessToken?.userId as number
      const result = await searchMessagesController(accountId, request.query)
      reply.send({
        message: 'Search messages successfully',
        data: result as SearchMessagesResType['data']
      })
    }
  )
}
