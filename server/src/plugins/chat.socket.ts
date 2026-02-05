import { chatRepository } from '@/repositories/chat.repository'
import { getChalk } from '@/utils/helpers'
import type { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'

// Conversation room prefix
const CONVERSATION_ROOM_PREFIX = 'conversation-'

// Typing indicator timeout (3 seconds)
const TYPING_TIMEOUT = 3000

// Store typing indicators: conversationId -> Set of userIds who are typing
const typingUsers = new Map<number, Set<number>>()

// Store typing timeouts: conversationId -> userId -> timeout
const typingTimeouts = new Map<number, Map<number, NodeJS.Timeout>>()

/**
 * Get conversation room name
 */
function getConversationRoom(conversationId: number): string {
  return `${CONVERSATION_ROOM_PREFIX}${conversationId}`
}

/**
 * Register chat socket handlers
 */
export async function registerChatSocketHandlers(fastify: FastifyInstance, socket: Socket) {
  const chalk = await getChalk()
  const accountId = (socket.handshake.auth.decodedAccessToken as any)?.userId as number

  if (!accountId) {
    console.error(chalk.red('❌ Chat socket: No accountId found'))
    return
  }

  /**
   * Join conversation room
   * Client emits: 'join-conversation', { conversationId: number }
   */
  socket.on('join-conversation', async (data: { conversationId: number }) => {
    try {
      const { conversationId } = data

      if (!conversationId || typeof conversationId !== 'number') {
        socket.emit('error', { message: 'Invalid conversationId' })
        return
      }

      // Verify user is a participant
      const conversation = await chatRepository.findById(conversationId, accountId)
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' })
        return
      }

      // Join conversation room
      const room = getConversationRoom(conversationId)
      await socket.join(room)

      // Log in development only
      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.cyanBright(`👤 User ${accountId} joined conversation ${conversationId}`))
      }

      // Emit confirmation
      socket.emit('joined-conversation', { conversationId })

      // Notify other participants (optional - for online status)
      socket.to(room).emit('user-joined-conversation', {
        conversationId,
        userId: accountId
      })
    } catch (error: any) {
      // Log error (always log errors, even in production)
      if (process.env.NODE_ENV !== 'production') {
        console.error(chalk.red('❌ Error joining conversation:'), error)
      }
      socket.emit('error', { message: error.message || 'Failed to join conversation' })
    }
  })

  /**
   * Leave conversation room
   * Client emits: 'leave-conversation', { conversationId: number }
   */
  socket.on('leave-conversation', async (data: { conversationId: number }) => {
    try {
      const { conversationId } = data

      if (!conversationId || typeof conversationId !== 'number') {
        return
      }

      const room = getConversationRoom(conversationId)
      await socket.leave(room)

      // Log in development only
      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.yellow(`👤 User ${accountId} left conversation ${conversationId}`))
      }

      // Clear typing indicator
      clearTypingIndicator(conversationId, accountId)

      // Emit confirmation
      socket.emit('left-conversation', { conversationId })

      // Notify other participants
      socket.to(room).emit('user-left-conversation', {
        conversationId,
        userId: accountId
      })
    } catch (error: any) {
      console.error(chalk.red('❌ Error leaving conversation:'), error)
    }
  })

  /**
   * Typing start indicator
   * Client emits: 'typing-start', { conversationId: number }
   */
  socket.on('typing-start', async (data: { conversationId: number }) => {
    try {
      const { conversationId } = data

      if (!conversationId || typeof conversationId !== 'number') {
        return
      }

      // Verify user is a participant
      const conversation = await chatRepository.findById(conversationId, accountId)
      if (!conversation) {
        return
      }

      // Add user to typing set
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set())
      }
      typingUsers.get(conversationId)!.add(accountId)

      // Clear existing timeout
      if (typingTimeouts.has(conversationId)) {
        const userTimeouts = typingTimeouts.get(conversationId)!
        if (userTimeouts.has(accountId)) {
          clearTimeout(userTimeouts.get(accountId)!)
        }
      } else {
        typingTimeouts.set(conversationId, new Map())
      }

      // Set timeout to auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        clearTypingIndicator(conversationId, accountId)
      }, TYPING_TIMEOUT)

      typingTimeouts.get(conversationId)!.set(accountId, timeout)

      // Broadcast typing indicator to other participants
      const room = getConversationRoom(conversationId)
      socket.to(room).emit('typing-start', {
        conversationId,
        userId: accountId
      })
    } catch (error: any) {
      console.error(chalk.red('❌ Error in typing-start:'), error)
    }
  })

  /**
   * Typing stop indicator
   * Client emits: 'typing-stop', { conversationId: number }
   */
  socket.on('typing-stop', async (data: { conversationId: number }) => {
    try {
      const { conversationId } = data

      if (!conversationId || typeof conversationId !== 'number') {
        return
      }

      clearTypingIndicator(conversationId, accountId)

      // Broadcast typing stop to other participants
      const room = getConversationRoom(conversationId)
      socket.to(room).emit('typing-stop', {
        conversationId,
        userId: accountId
      })
    } catch (error: any) {
      console.error(chalk.red('❌ Error in typing-stop:'), error)
    }
  })

  /**
   * Clear typing indicator for a user
   */
  function clearTypingIndicator(conversationId: number, userId: number) {
    if (typingUsers.has(conversationId)) {
      typingUsers.get(conversationId)!.delete(userId)
      if (typingUsers.get(conversationId)!.size === 0) {
        typingUsers.delete(conversationId)
      }
    }

    if (typingTimeouts.has(conversationId)) {
      const userTimeouts = typingTimeouts.get(conversationId)!
      if (userTimeouts.has(userId)) {
        clearTimeout(userTimeouts.get(userId)!)
        userTimeouts.delete(userId)
      }
      if (userTimeouts.size === 0) {
        typingTimeouts.delete(conversationId)
      }
    }
  }

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    // Clear all typing indicators for this user
    typingUsers.forEach((users, conversationId) => {
      if (users.has(accountId)) {
        clearTypingIndicator(conversationId, accountId)

        // Notify other participants
        const room = getConversationRoom(conversationId)
        socket.to(room).emit('typing-stop', {
          conversationId,
          userId: accountId
        })
      }
    })
  })
}

/**
 * Emit new message event to conversation participants
 */
export function emitNewMessage(fastify: FastifyInstance, conversationId: number, message: any) {
  const room = getConversationRoom(conversationId)
  fastify.io.to(room).emit('new-message', {
    conversationId,
    message
  })
}

/**
 * Emit message updated event to conversation participants
 */
export function emitMessageUpdated(fastify: FastifyInstance, conversationId: number, message: any) {
  const room = getConversationRoom(conversationId)
  fastify.io.to(room).emit('message-updated', {
    conversationId,
    message
  })
}

/**
 * Emit message deleted event to conversation participants
 */
export function emitMessageDeleted(fastify: FastifyInstance, conversationId: number, messageId: number) {
  const room = getConversationRoom(conversationId)
  fastify.io.to(room).emit('message-deleted', {
    conversationId,
    messageId
  })
}

/**
 * Emit read receipt event to message sender
 */
export function emitReadReceipt(fastify: FastifyInstance, conversationId: number, messageId: number, userId: number) {
  const room = getConversationRoom(conversationId)
  fastify.io.to(room).emit('read-receipt', {
    conversationId,
    messageId,
    userId
  })
}

/**
 * Emit reaction added event to conversation participants
 */
export function emitReactionAdded(fastify: FastifyInstance, conversationId: number, messageId: number, reaction: any) {
  const room = getConversationRoom(conversationId)
  fastify.io.to(room).emit('reaction-added', {
    conversationId,
    messageId,
    reaction
  })
}

/**
 * Emit reaction removed event to conversation participants
 */
export function emitReactionRemoved(
  fastify: FastifyInstance,
  conversationId: number,
  messageId: number,
  userId: number,
  emoji: string
) {
  const room = getConversationRoom(conversationId)
  fastify.io.to(room).emit('reaction-removed', {
    conversationId,
    messageId,
    userId,
    emoji
  })
}

/**
 * Emit conversation created event to new participants
 */
export function emitConversationCreated(fastify: FastifyInstance, conversation: any, participantIds: number[]) {
  // Emit to all participants
  participantIds.forEach((participantId) => {
    fastify.io.to(`user-${participantId}`).emit('conversation-created', {
      conversation
    })
  })
}

/**
 * Emit conversation updated event to participants
 */
export function emitConversationUpdated(fastify: FastifyInstance, conversationId: number, conversation: any) {
  const room = getConversationRoom(conversationId)
  fastify.io.to(room).emit('conversation-updated', {
    conversationId,
    conversation
  })
}

/**
 * Emit user online/offline status
 */
export function emitUserOnline(fastify: FastifyInstance, userId: number) {
  fastify.io.emit('user-online', { userId })
}

export function emitUserOffline(fastify: FastifyInstance, userId: number) {
  fastify.io.emit('user-offline', { userId })
}
