import { messageRepository } from '@/repositories/message.repository'
import { chatRepository } from '@/repositories/chat.repository'
import { messageAttachmentService } from '@/services/message-attachment.service'
import { API_URL } from '@/config'
import { EntityError } from '@/utils/errors'

interface GetMessagesParams {
  conversationId: number
  accountId: number
  before?: Date
  limit?: number
}

interface CreateMessageParams {
  conversationId: number
  senderId: number
  content: string
  replyToId?: number | null
  files?: any[] // MultipartFile array
}

interface SearchMessagesParams {
  accountId: number
  query: string
  conversationId?: number
  page?: number
  limit?: number
}

export const messageService = {
  /**
   * Get messages for a conversation with cursor-based pagination
   * Authorization: User must be a participant
   */
  async getMessages(params: GetMessagesParams) {
    // Check if user is participant
    const conversation = await chatRepository.findById(params.conversationId, params.accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    return await messageRepository.findAll({
      conversationId: params.conversationId,
      accountId: params.accountId,
      before: params.before,
      limit: params.limit
    })
  },

  /**
   * Get message by ID
   * Authorization: User must be a participant in the conversation
   */
  async getMessageById(id: number, accountId: number) {
    const message = await messageRepository.findById(id, accountId)
    if (!message) {
      throw new EntityError([{ field: 'id', message: 'Message not found or access denied' }])
    }

    // Check if user is participant in conversation
    const conversation = await chatRepository.findById(message.conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'id', message: 'Conversation not found or access denied' }])
    }

    return message
  },

  /**
   * Send new message
   * Authorization: User must be a participant
   */
  async sendMessage(data: CreateMessageParams) {
    // Check if user is participant
    const conversation = await chatRepository.findById(data.conversationId, data.senderId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    // Validate replyToId if provided
    if (data.replyToId) {
      const replyToMessage = await messageRepository.findById(data.replyToId, data.senderId)
      if (!replyToMessage) {
        throw new EntityError([{ field: 'replyToId', message: 'Reply message not found' }])
      }
      if (replyToMessage.conversationId !== data.conversationId) {
        throw new EntityError([{ field: 'replyToId', message: 'Reply message must be in the same conversation' }])
      }
    }

    // Determine message type based on attachments
    let messageType: 'text' | 'image' | 'file' = 'text'
    if (data.files && data.files.length > 0) {
      const firstFile = data.files[0]
      const mimeType = firstFile.mimetype || ''
      if (mimeType.startsWith('image/')) {
        messageType = 'image'
      } else {
        messageType = 'file'
      }
    }

    // Create message
    const message = await messageRepository.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      type: messageType,
      replyToId: data.replyToId
    })

    // Handle file attachments if provided
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        await messageAttachmentService.createAttachment({
          messageId: message.id,
          file
        })
      }
    }

    // Update conversation timestamp
    await chatRepository.updateTimestamp(data.conversationId)

    // Fetch message with all relations (including attachments)
    const messageWithRelations = await messageRepository.findById(message.id, data.senderId)
    if (!messageWithRelations) {
      throw new EntityError([{ field: 'id', message: 'Failed to retrieve created message' }])
    }

    // Add fileUrl to attachments if they exist
    if (messageWithRelations.attachments && messageWithRelations.attachments.length > 0) {
      messageWithRelations.attachments = messageWithRelations.attachments.map((attachment) => ({
        ...attachment,
        fileUrl: `${API_URL}/static/chat/${attachment.filePath}`
      }))
    }

    return messageWithRelations
  },

  /**
   * Edit message
   * Authorization: Only sender can edit their own message
   */
  async editMessage(id: number, accountId: number, content: string) {
    const message = await messageRepository.findById(id, accountId)
    if (!message) {
      throw new EntityError([{ field: 'id', message: 'Message not found or access denied' }])
    }

    // Check if user is sender
    if (message.senderId !== accountId) {
      throw new EntityError([{ field: 'id', message: 'Only message sender can edit the message' }])
    }

    // Check if message is deleted
    if (message.isDeleted) {
      throw new EntityError([{ field: 'id', message: 'Cannot edit deleted message' }])
    }

    // Validate content length (max 5000 characters)
    if (content.length > 5000) {
      throw new EntityError([{ field: 'content', message: 'Message content cannot exceed 5000 characters' }])
    }

    // Update message
    return await messageRepository.update(id, { content })
  },

  /**
   * Delete message (soft delete)
   * Authorization: Only sender can delete their own message
   */
  async deleteMessage(id: number, accountId: number) {
    const message = await messageRepository.findById(id, accountId)
    if (!message) {
      throw new EntityError([{ field: 'id', message: 'Message not found or access denied' }])
    }

    // Check if user is sender
    if (message.senderId !== accountId) {
      throw new EntityError([{ field: 'id', message: 'Only message sender can delete the message' }])
    }

    // Soft delete
    await messageRepository.delete(id)
    return { success: true }
  },

  /**
   * Mark message as read
   * Authorization: User must be a participant
   */
  async markMessageAsRead(messageId: number, accountId: number) {
    const message = await messageRepository.findById(messageId, accountId)
    if (!message) {
      throw new EntityError([{ field: 'messageId', message: 'Message not found or access denied' }])
    }

    // Check if user is participant
    const conversation = await chatRepository.findById(message.conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'messageId', message: 'Conversation not found or access denied' }])
    }

    // Mark as read
    await messageRepository.markAsRead(messageId, accountId)

    // Update participant's lastReadAt
    await messageRepository.updateLastReadAt(message.conversationId, accountId)

    return { success: true }
  },

  /**
   * Add reaction to message
   * Authorization: User must be a participant
   */
  async addReaction(messageId: number, accountId: number, emoji: string) {
    const message = await messageRepository.findById(messageId, accountId)
    if (!message) {
      throw new EntityError([{ field: 'messageId', message: 'Message not found or access denied' }])
    }

    // Check if user is participant
    const conversation = await chatRepository.findById(message.conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'messageId', message: 'Conversation not found or access denied' }])
    }

    return await messageRepository.addReaction(messageId, accountId, emoji)
  },

  /**
   * Remove reaction from message
   * Authorization: User must be a participant
   */
  async removeReaction(messageId: number, accountId: number, emoji: string) {
    const message = await messageRepository.findById(messageId, accountId)
    if (!message) {
      throw new EntityError([{ field: 'messageId', message: 'Message not found or access denied' }])
    }

    // Check if user is participant
    const conversation = await chatRepository.findById(message.conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'messageId', message: 'Conversation not found or access denied' }])
    }

    const removed = await messageRepository.removeReaction(messageId, accountId, emoji)
    if (!removed) {
      throw new EntityError([{ field: 'emoji', message: 'Reaction not found' }])
    }

    return { success: true }
  },

  /**
   * Search messages across user's conversations
   */
  async searchMessages(params: SearchMessagesParams) {
    const { messages, total } = await messageRepository.search({
      accountId: params.accountId,
      query: params.query,
      conversationId: params.conversationId,
      page: params.page,
      limit: params.limit
    })

    // Calculate pagination metadata
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const totalPages = Math.ceil(total / limit)

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  }
}
