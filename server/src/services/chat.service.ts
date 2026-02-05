import prisma from '@/database'
import { chatRepository } from '@/repositories/chat.repository'
import { Role } from '@/constants/type'
import { EntityError, ForbiddenError } from '@/utils/errors'

interface GetConversationsParams {
  accountId: number
  type?: 'direct' | 'group'
  search?: string
  page?: number
  limit?: number
  sortBy?: 'updatedAt' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export const chatService = {
  /**
   * Get conversations for a user with filtering, search, pagination, and sorting
   */
  async getConversations(params: GetConversationsParams) {
    const { conversations, total } = await chatRepository.findAll(params)

    // Calculate pagination metadata
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const totalPages = Math.ceil(total / limit)

    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  },

  /**
   * Get conversation by ID
   * Authorization: User must be a participant
   */
  async getConversationById(id: number, accountId: number) {
    const conversation = await chatRepository.findById(id, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'id', message: 'Conversation not found or access denied' }])
    }

    return conversation
  },

  /**
   * Create new conversation
   * Validation:
   * - Group chats can only be created by Owner
   * - Direct chats can be created by any authenticated user
   * - Participant IDs must be valid and exist
   */
  async createConversation(data: {
    type: 'direct' | 'group'
    name?: string | null
    avatar?: string | null
    createdById: number
    participantIds: number[]
    creatorRole: string // Pass role from JWT token
  }) {
    // Validate conversation type
    const validTypes = ['direct', 'group']
    if (!validTypes.includes(data.type)) {
      throw new EntityError([{ field: 'type', message: `Type must be one of: ${validTypes.join(', ')}` }])
    }

    // Authorization: Only Owner can create group chats
    if (data.type === 'group' && data.creatorRole !== Role.Owner) {
      throw new ForbiddenError('Only Owner can create group chats')
    }

    // Validate participants
    if (!data.participantIds || data.participantIds.length === 0) {
      throw new EntityError([{ field: 'participantIds', message: 'At least one participant is required' }])
    }

    // For direct chats, must have exactly 1 other participant (plus creator = 2 total)
    if (data.type === 'direct') {
      if (data.participantIds.length !== 1) {
        throw new EntityError([
          { field: 'participantIds', message: 'Direct chat must have exactly one other participant' }
        ])
      }
    }

    // For group chats, validate participant count (max 50 including creator)
    if (data.type === 'group') {
      const totalParticipants = data.participantIds.length + 1 // +1 for creator
      if (totalParticipants > 50) {
        throw new EntityError([{ field: 'participantIds', message: 'Group chat cannot exceed 50 participants' }])
      }
    }

    // Validate that all participant IDs exist and are valid accounts
    const participantAccounts = await prisma.account.findMany({
      where: {
        id: { in: data.participantIds },
        role: { in: [Role.Owner, Role.Employee] } // Only Owner and Employee can chat
      },
      select: { id: true }
    })

    if (participantAccounts.length !== data.participantIds.length) {
      throw new EntityError([
        { field: 'participantIds', message: 'One or more participant IDs are invalid or not allowed' }
      ])
    }

    // Check if direct conversation already exists
    if (data.type === 'direct' && data.participantIds.length === 1) {
      const existingDirect = await chatRepository.findDirectConversation(data.createdById, data.participantIds[0])
      if (existingDirect) {
        // Return existing conversation instead of creating new one
        return existingDirect
      }
    }

    // Validate name for group chats
    if (data.type === 'group' && !data.name) {
      throw new EntityError([{ field: 'name', message: 'Group chat name is required' }])
    }

    // Create conversation
    const conversation = await chatRepository.create({
      type: data.type,
      name: data.name ?? null,
      avatar: data.avatar ?? null,
      createdById: data.createdById,
      participantIds: data.participantIds
    })

    return conversation
  },

  /**
   * Update conversation (name, avatar for group chats)
   * Authorization: User must be a participant
   */
  async updateConversation(
    id: number,
    accountId: number,
    data: {
      name?: string | null
      avatar?: string | null
    }
  ) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(id, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'id', message: 'Conversation not found or access denied' }])
    }

    // Only group chats can be updated
    if (conversation.type !== 'group') {
      throw new EntityError([{ field: 'type', message: 'Only group chats can be updated' }])
    }

    // Update conversation
    return await chatRepository.update(id, data)
  },

  /**
   * Delete/leave conversation
   * Authorization: User must be a participant
   */
  async deleteConversation(id: number, accountId: number) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(id, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'id', message: 'Conversation not found or access denied' }])
    }

    // For group chats, just remove participant (don't delete conversation)
    if (conversation.type === 'group') {
      await chatRepository.removeParticipant(id, accountId)
      return { success: true, action: 'left' }
    }

    // For direct chats, delete the conversation (both participants removed via cascade)
    await chatRepository.delete(id)
    return { success: true, action: 'deleted' }
  },

  /**
   * Add participants to group chat
   * Authorization: Only conversation creator can add participants
   */
  async addParticipants(conversationId: number, accountId: number, participantIds: number[]) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    // Only group chats can have participants added
    if (conversation.type !== 'group') {
      throw new EntityError([{ field: 'type', message: 'Only group chats can have participants added' }])
    }

    // Authorization: Only creator can add participants
    if (conversation.createdById !== accountId) {
      throw new ForbiddenError('Only group creator can manage participants')
    }

    // Validate participants
    if (!participantIds || participantIds.length === 0) {
      throw new EntityError([{ field: 'participantIds', message: 'At least one participant is required' }])
    }

    // Validate that all participant IDs exist and are valid accounts
    const participantAccounts = await prisma.account.findMany({
      where: {
        id: { in: participantIds },
        role: { in: [Role.Owner, Role.Employee] }
      },
      select: { id: true }
    })

    if (participantAccounts.length !== participantIds.length) {
      throw new EntityError([
        { field: 'participantIds', message: 'One or more participant IDs are invalid or not allowed' }
      ])
    }

    // Add participants (repository handles 50 limit check)
    const participants = await chatRepository.addParticipants(conversationId, participantIds)

    return participants
  },

  /**
   * Remove participant from group chat
   * Authorization: Only conversation creator can remove participants
   */
  async removeParticipant(conversationId: number, accountId: number, targetAccountId: number) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    // Only group chats can have participants removed
    if (conversation.type !== 'group') {
      throw new EntityError([{ field: 'type', message: 'Only group chats can have participants removed' }])
    }

    // Authorization: Only creator can remove participants
    if (conversation.createdById !== accountId) {
      throw new ForbiddenError('Only group creator can manage participants')
    }

    // Cannot remove creator
    if (targetAccountId === conversation.createdById) {
      throw new EntityError([{ field: 'targetAccountId', message: 'Cannot remove conversation creator' }])
    }

    // Remove participant
    const removed = await chatRepository.removeParticipant(conversationId, targetAccountId)
    if (!removed) {
      throw new EntityError([{ field: 'targetAccountId', message: 'Participant not found in conversation' }])
    }

    return { success: true }
  },

  /**
   * Pin conversation for user
   * Authorization: User must be a participant
   */
  async pinConversation(conversationId: number, accountId: number) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    await chatRepository.pinConversation(conversationId, accountId)
    return { success: true }
  },

  /**
   * Unpin conversation for user
   * Authorization: User must be a participant
   */
  async unpinConversation(conversationId: number, accountId: number) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    const unpinned = await chatRepository.unpinConversation(conversationId, accountId)
    if (!unpinned) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation is not pinned' }])
    }

    return { success: true }
  },

  /**
   * Mute conversation for user
   * Authorization: User must be a participant
   */
  async muteConversation(conversationId: number, accountId: number) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    await chatRepository.muteConversation(conversationId, accountId)
    return { success: true }
  },

  /**
   * Unmute conversation for user
   * Authorization: User must be a participant
   */
  async unmuteConversation(conversationId: number, accountId: number) {
    // Check if conversation exists and user is participant
    const conversation = await chatRepository.findById(conversationId, accountId)
    if (!conversation) {
      throw new EntityError([{ field: 'conversationId', message: 'Conversation not found or access denied' }])
    }

    await chatRepository.unmuteConversation(conversationId, accountId)
    return { success: true }
  }
}
