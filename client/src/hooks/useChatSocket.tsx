'use client'

import { useAppStore } from '@/components/app-provider'
import { ConversationType } from '@/schemaValidations/chat.schema'
import { MessageType } from '@/schemaValidations/message.schema'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

interface UseChatSocketOptions {
  conversationId?: number
  onNewMessage?: (message: MessageType, conversationId: number) => void
  onMessageUpdated?: (message: MessageType, conversationId: number) => void
  onMessageDeleted?: (messageId: number, conversationId: number) => void
  onReadReceipt?: (messageId: number, userId: number, conversationId: number) => void
  onReactionAdded?: (messageId: number, reaction: any, conversationId: number) => void
  onReactionRemoved?: (
    messageId: number,
    userId: number,
    emoji: string,
    conversationId: number
  ) => void
  onTypingStart?: (userId: number, conversationId: number) => void
  onTypingStop?: (userId: number, conversationId: number) => void
  onConversationUpdated?: (conversation: ConversationType, conversationId: number) => void
  onUserJoined?: (userId: number, conversationId: number) => void
  onUserLeft?: (userId: number, conversationId: number) => void
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const socket = useAppStore((state) => state.socket)
  const queryClient = useQueryClient()
  const {
    conversationId,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onReadReceipt,
    onReactionAdded,
    onReactionRemoved,
    onTypingStart,
    onTypingStop,
    onConversationUpdated,
    onUserJoined,
    onUserLeft,
  } = options

  // Store callbacks in refs to avoid re-subscribing on every render
  const callbacksRef = useRef({
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onReadReceipt,
    onReactionAdded,
    onReactionRemoved,
    onTypingStart,
    onTypingStop,
    onConversationUpdated,
    onUserJoined,
    onUserLeft,
  })

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onMessageUpdated,
      onMessageDeleted,
      onReadReceipt,
      onReactionAdded,
      onReactionRemoved,
      onTypingStart,
      onTypingStop,
      onConversationUpdated,
      onUserJoined,
      onUserLeft,
    }
  }, [
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onReadReceipt,
    onReactionAdded,
    onReactionRemoved,
    onTypingStart,
    onTypingStop,
    onConversationUpdated,
    onUserJoined,
    onUserLeft,
  ])

  // Join conversation room
  const joinConversation = useCallback(
    (convId: number) => {
      if (socket?.connected) {
        socket.emit('join-conversation', { conversationId: convId })
      }
    },
    [socket]
  )

  // Leave conversation room
  const leaveConversation = useCallback(
    (convId: number) => {
      if (socket?.connected) {
        socket.emit('leave-conversation', { conversationId: convId })
      }
    },
    [socket]
  )

  // Send typing start
  const sendTypingStart = useCallback(
    (convId: number) => {
      if (socket?.connected) {
        socket.emit('typing-start', { conversationId: convId })
      }
    },
    [socket]
  )

  // Send typing stop
  const sendTypingStop = useCallback(
    (convId: number) => {
      if (socket?.connected) {
        socket.emit('typing-stop', { conversationId: convId })
      }
    },
    [socket]
  )

  // Join conversation when conversationId changes
  useEffect(() => {
    if (conversationId && socket?.connected) {
      joinConversation(conversationId)
    }

    return () => {
      if (conversationId && socket?.connected) {
        leaveConversation(conversationId)
      }
    }
  }, [conversationId, socket, joinConversation, leaveConversation])

  // Listen to socket events
  useEffect(() => {
    if (!socket) return

    // New message event
    function handleNewMessage(data: { message: MessageType; conversationId: number }) {
      const { message, conversationId: convId } = data

      // Update message list for this conversation (current query uses queryParams = undefined)
      queryClient.setQueryData(['chat', 'messages', convId, undefined], (oldData: any) => {
        if (!oldData?.payload?.data) return oldData

        const existingMessages = oldData.payload.data.messages || []
        const alreadyExists = existingMessages.some((m: MessageType) => m.id === message.id)
        if (alreadyExists) return oldData // tránh trùng tin nhắn (optimistic + ws)

        return {
          ...oldData,
          payload: {
            ...oldData.payload,
            data: {
              ...oldData.payload.data,
              messages: [message, ...existingMessages],
            },
          },
        }
      })

      // Đảm bảo nếu cache key không khớp thì vẫn refetch được
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', convId] })
      // Invalidate conversations để cập nhật last message / unread
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })

      // Gọi callback custom (nếu có)
      callbacksRef.current.onNewMessage?.(message, convId)
    }

    // Message updated event
    function handleMessageUpdated(data: { message: MessageType; conversationId: number }) {
      const { message, conversationId: convId } = data

      // Invalidate messages cache
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', convId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', message.id] })

      // Call custom callback
      callbacksRef.current.onMessageUpdated?.(message, convId)
    }

    // Message deleted event
    function handleMessageDeleted(data: { messageId: number; conversationId: number }) {
      const { messageId, conversationId: convId } = data

      // Invalidate messages cache
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', convId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', messageId] })

      // Call custom callback
      callbacksRef.current.onMessageDeleted?.(messageId, convId)
    }

    // Read receipt event
    function handleReadReceipt(data: {
      messageId: number
      userId: number
      conversationId: number
    }) {
      const { messageId, userId, conversationId: convId } = data

      // Invalidate messages to update read receipts
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', convId] })

      // Call custom callback
      callbacksRef.current.onReadReceipt?.(messageId, userId, convId)
    }

    // Reaction added event
    function handleReactionAdded(data: {
      messageId: number
      reaction: any
      conversationId: number
    }) {
      const { messageId, reaction, conversationId: convId } = data

      // Invalidate messages to update reactions
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', convId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', messageId] })

      // Call custom callback
      callbacksRef.current.onReactionAdded?.(messageId, reaction, convId)
    }

    // Reaction removed event
    function handleReactionRemoved(data: {
      messageId: number
      userId: number
      emoji: string
      conversationId: number
    }) {
      const { messageId, userId, emoji, conversationId: convId } = data

      // Invalidate messages to update reactions
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', convId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', messageId] })

      // Call custom callback
      callbacksRef.current.onReactionRemoved?.(messageId, userId, emoji, convId)
    }

    // Typing start event
    function handleTypingStart(data: { userId: number; conversationId: number }) {
      const { userId, conversationId: convId } = data
      callbacksRef.current.onTypingStart?.(userId, convId)
    }

    // Typing stop event
    function handleTypingStop(data: { userId: number; conversationId: number }) {
      const { userId, conversationId: convId } = data
      callbacksRef.current.onTypingStop?.(userId, convId)
    }

    // Conversation updated event
    function handleConversationUpdated(data: {
      conversation: ConversationType
      conversationId: number
    }) {
      const { conversation, conversationId: convId } = data

      // Invalidate conversations cache
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', convId] })

      // Call custom callback
      callbacksRef.current.onConversationUpdated?.(conversation, convId)
    }

    // User joined conversation event
    function handleUserJoined(data: { userId: number; conversationId: number }) {
      const { userId, conversationId: convId } = data
      callbacksRef.current.onUserJoined?.(userId, convId)
    }

    // User left conversation event
    function handleUserLeft(data: { userId: number; conversationId: number }) {
      const { userId, conversationId: convId } = data
      callbacksRef.current.onUserLeft?.(userId, convId)
    }

    // Join/leave confirmation events
    function handleJoinedConversation(data: { conversationId: number }) {
      console.log('[ChatSocket] ✅ Joined conversation:', data.conversationId)
    }

    function handleLeftConversation(data: { conversationId: number }) {
      console.log('[ChatSocket] 👋 Left conversation:', data.conversationId)
    }

    // Error event
    function handleError(data: { message: string }) {
      console.error('[ChatSocket] ❌ Error:', data.message)
    }

    // Register event listeners
    socket.on('new-message', handleNewMessage)
    socket.on('message-updated', handleMessageUpdated)
    socket.on('message-deleted', handleMessageDeleted)
    socket.on('read-receipt', handleReadReceipt)
    socket.on('reaction-added', handleReactionAdded)
    socket.on('reaction-removed', handleReactionRemoved)
    socket.on('typing-start', handleTypingStart)
    socket.on('typing-stop', handleTypingStop)
    socket.on('conversation-updated', handleConversationUpdated)
    socket.on('user-joined-conversation', handleUserJoined)
    socket.on('user-left-conversation', handleUserLeft)
    socket.on('joined-conversation', handleJoinedConversation)
    socket.on('left-conversation', handleLeftConversation)
    socket.on('error', handleError)

    // Cleanup
    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('message-updated', handleMessageUpdated)
      socket.off('message-deleted', handleMessageDeleted)
      socket.off('read-receipt', handleReadReceipt)
      socket.off('reaction-added', handleReactionAdded)
      socket.off('reaction-removed', handleReactionRemoved)
      socket.off('typing-start', handleTypingStart)
      socket.off('typing-stop', handleTypingStop)
      socket.off('conversation-updated', handleConversationUpdated)
      socket.off('user-joined-conversation', handleUserJoined)
      socket.off('user-left-conversation', handleUserLeft)
      socket.off('joined-conversation', handleJoinedConversation)
      socket.off('left-conversation', handleLeftConversation)
      socket.off('error', handleError)
    }
  }, [socket, queryClient])

  return {
    socket,
    isConnected: socket?.connected ?? false,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
  }
}
