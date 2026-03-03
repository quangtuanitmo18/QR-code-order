import { chatRepository } from '@/repositories/chat.repository'
import { messageRepository } from '@/repositories/message.repository'
import { callService } from '@/services/call.service'
import { notificationService } from '@/services/notification.service'
import { getChalk } from '@/utils/helpers'
import type { FastifyInstance } from 'fastify'
import { types as mediasoupTypes } from 'mediasoup'
import { Socket } from 'socket.io'
import { emitNewMessage } from './chat.socket'
type DtlsParameters = mediasoupTypes.DtlsParameters
type MediaKind = mediasoupTypes.MediaKind
type RtpCapabilities = mediasoupTypes.RtpCapabilities
type RtpParameters = mediasoupTypes.RtpParameters

// Call room prefix (typically same as conversation or a dedicated call ID)
const CALL_ROOM_PREFIX = 'call-'

/**
 * Get call room name
 */
function getCallRoom(conversationId: number): string {
  return `${CALL_ROOM_PREFIX}${conversationId}`
}

/**
 * Register call socket handlers for simple P2P signaling / Mediasoup App Signaling
 */
export async function registerCallSocketHandlers(fastify: FastifyInstance, socket: Socket) {
  const chalk = await getChalk()
  const accountId = (socket.handshake.auth.decodedAccessToken as any)?.userId as number

  if (!accountId) {
    console.error(chalk.red('❌ Call socket: No accountId found'))
    return
  }

  // Keep track of the active call conversation for this socket connection
  // for graceful cleanup on unexpected disconnects.
  let activeCallConversationId: number | null = null
  let callAccepted = false
  let callIsVideo = false
  let callerId: number | null = null // The account who initiated the call
  let callMessageCreated = false // Guard against double-creation

  // Listener for active-speaker events from callService
  const activeSpeakerListener = (data: { conversationId: number; accountId: number | null; volume: number }) => {
    if (activeCallConversationId === data.conversationId) {
      const callRoom = getCallRoom(data.conversationId)
      fastify.io.to(callRoom).emit('active-speaker', data)
    }
  }

  // Subscribe to callService events
  callService.on('active-speaker', activeSpeakerListener)

  /**
   * Request a call (Ringing)
   * Client emits: 'call-request', { conversationId: number, isVideo: boolean }
   */
  socket.on('call-request', async (data: { conversationId: number; isVideo: boolean }) => {
    try {
      const { conversationId, isVideo } = data

      if (!conversationId) return

      // Verify user is a participant
      const conversation = await chatRepository.findById(conversationId, accountId)
      if (!conversation) {
        socket.emit('call-error', { message: 'Conversation not found or access denied' })
        return
      }

      // Notify other participants that a call is incoming
      // We emit to all participants in the conversation EXCEPT the caller
      conversation.participants.forEach(async (p: any) => {
        if (p.accountId !== accountId) {
          const targetSocketRoom = `user-${p.accountId}`
          // Assuming user sockets join a room like `user-${accountId}` (similar to chat plugin emits)
          fastify.io.to(targetSocketRoom).emit('call-incoming', {
            conversationId,
            callerId: accountId,
            isVideo
          })

          // Push Notification Logic for Call Ringing
          const targetSockets = await fastify.io.in(targetSocketRoom).fetchSockets()
          const isOnline = targetSockets.length > 0
          let isFocused = false
          for (const s of targetSockets) {
            if (s.data?.isFocused) {
              isFocused = true
              break
            }
          }

          if (!isOnline || !isFocused) {
            const callerParticipant = conversation.participants.find((x: any) => x.accountId === accountId)
            const callerName = callerParticipant?.account?.name || 'Someone'

            await notificationService.sendToAccount(p.accountId, {
              title: `Incoming ${isVideo ? 'Video ' : ''}Call`,
              body: `${callerName} is calling you`,
              data: {
                type: 'INCOMING_CALL',
                conversationId: String(conversationId)
              }
            })
          }
        }
      })

      // Caller joins a dedicated call room
      const callRoom = getCallRoom(conversationId)
      await socket.join(callRoom)
      activeCallConversationId = conversationId
      callAccepted = false
      callIsVideo = isVideo
      callerId = accountId
      callMessageCreated = false

      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.cyanBright(`📞 User ${accountId} is calling in conversation ${conversationId}`))
      }

      socket.emit('call-ringing', { conversationId })
    } catch (error: any) {
      console.error(chalk.red('❌ Error initiating call:'), error)
      socket.emit('call-error', { message: error.message || 'Failed to initiate call' })
    }
  })

  /**
   * Accept a call
   * Client emits: 'call-accept', { conversationId: number }
   */
  socket.on('call-accept', async (data: { conversationId: number }) => {
    try {
      const { conversationId } = data
      if (!conversationId) return

      const conversation = await chatRepository.findById(conversationId, accountId)
      if (!conversation) return

      const callRoom = getCallRoom(conversationId)
      await socket.join(callRoom)
      activeCallConversationId = conversationId
      callAccepted = true

      // Notify the person who initiated the call that it was accepted
      socket.to(callRoom).emit('call-accepted', {
        conversationId,
        responderId: accountId
      })

      // Send a silent FCM payload to the answering user's OTHER offline/blurred devices
      // so their ringing notifications disappear immediately when they answer on one device.
      await notificationService.sendSilentDataToAccount(accountId, {
        type: 'CALL_CANCELLED',
        conversationId: String(conversationId)
      })

      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.greenBright(`📞 User ${accountId} accepted call in conversation ${conversationId}`))
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error accepting call:'), error)
    }
  })

  /**
   * Check if there is an active (ringing) call in a conversation.
   * Used when a user opens the page from a push notification and needs
   * to restore the incoming-call UI that was missed because the socket
   * was not yet connected when the original call-incoming was emitted.
   *
   * Client emits:  'call-check', { conversationId: number }
   * Server replies: 'call-incoming' if a caller is waiting, or nothing.
   */
  socket.on('call-check', async (data: { conversationId: number; isVideo?: boolean }) => {
    try {
      const { conversationId } = data
      if (!conversationId) return

      // Verify user is a participant
      const conversation = await chatRepository.findById(conversationId, accountId)
      if (!conversation) return

      const callRoom = getCallRoom(conversationId)
      const socketsInRoom = await fastify.io.in(callRoom).fetchSockets()

      // If there are sockets in the call room, someone is calling
      if (socketsInRoom.length > 0) {
        // Find the caller (the first socket in the room that is NOT this user)
        let callerAccountId: number | null = null
        const isVideo = data.isVideo ?? false

        for (const s of socketsInRoom) {
          const sid = (s.handshake.auth.decodedAccessToken as any)?.userId as number
          if (sid && sid !== accountId) {
            callerAccountId = sid
            break
          }
        }

        if (callerAccountId) {
          // Re-emit call-incoming directly to THIS socket only
          socket.emit('call-incoming', {
            conversationId,
            callerId: callerAccountId,
            isVideo
          })

          if (process.env.NODE_ENV !== 'production') {
            console.log(
              chalk.cyanBright(`📞 Re-emitted call-incoming to user ${accountId} for conversation ${conversationId}`)
            )
          }
        }
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error checking call:'), error)
    }
  })

  /**
   * Decline a call
   * Client emits: 'call-decline', { conversationId: number }
   */
  socket.on('call-decline', async (data: { conversationId: number }) => {
    try {
      const { conversationId } = data
      if (!conversationId) return

      const conversation = await chatRepository.findById(conversationId, accountId)
      if (!conversation) return

      // Notify the caller that the call was declined
      // The caller is inside the callRoom
      const callRoom = getCallRoom(conversationId)
      fastify.io.to(callRoom).emit('call-declined', {
        conversationId,
        responderId: accountId
      })

      // Send a silent FCM payload to everyone else in the call room to stop ringing
      conversation.participants.forEach(async (p: any) => {
        if (p.accountId !== accountId) {
          await notificationService.sendSilentDataToAccount(p.accountId, {
            type: 'CALL_CANCELLED',
            conversationId: String(conversationId)
          })
        }
      })

      // Create "declined" call message — sender = the person who initiated the call
      if (!callMessageCreated) {
        callMessageCreated = true
        const senderId = callerId ?? accountId
        try {
          const callMessage = await messageRepository.createCallMessage({
            conversationId,
            senderId,
            callMeta: { callType: callIsVideo ? 'video' : 'voice', callStatus: 'declined', durationSeconds: 0 }
          })
          await chatRepository.updateTimestamp(conversationId)
          await emitNewMessage(fastify, conversationId, callMessage, senderId)
        } catch (err) {
          console.error(chalk.red('❌ Error creating declined call message:'), err)
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.yellowBright(`📞 User ${accountId} declined call in conversation ${conversationId}`))
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error declining call:'), error)
    }
  })

  /**
   * End a call
   * Client emits: 'call-end', { conversationId: number }
   */
  socket.on('call-end', async (data: { conversationId: number; durationSeconds?: number }) => {
    try {
      const { conversationId, durationSeconds } = data
      if (!conversationId) return

      const callRoom = getCallRoom(conversationId)

      // Notify everyone in the call room
      fastify.io.to(callRoom).emit('call-ended', {
        conversationId,
        endedById: accountId
      })

      // The socket leaves the room
      await socket.leave(callRoom)

      // Cleanup Mediasoup resources for this peer
      callService.cleanupPeer(conversationId, accountId)

      // Create call message
      if (!callMessageCreated) {
        callMessageCreated = true
        const callStatus = callAccepted ? 'completed' : 'missed'
        const duration = callAccepted ? Math.min(Math.max(Math.floor(durationSeconds ?? 0), 0), 86400) : 0
        const senderId = callerId ?? accountId
        try {
          const callMessage = await messageRepository.createCallMessage({
            conversationId,
            senderId,
            callMeta: {
              callType: callIsVideo ? 'video' : 'voice',
              callStatus: callStatus as any,
              durationSeconds: duration
            }
          })
          await chatRepository.updateTimestamp(conversationId)
          await emitNewMessage(fastify, conversationId, callMessage, senderId)
        } catch (err) {
          console.error(chalk.red('❌ Error creating call message:'), err)
        }
      }

      if (activeCallConversationId === conversationId) {
        activeCallConversationId = null
        callAccepted = false
        callerId = null
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.gray(`📞 User ${accountId} ended call in conversation ${conversationId}`))
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error ending call:'), error)
    }
  })

  // ==========================================
  // Mediasoup WebRTC Signaling handlers
  // ==========================================

  socket.on(
    'getRouterRtpCapabilities',
    async (
      data: { conversationId: number },
      callback: (res: { capabilities?: RtpCapabilities; error?: string }) => void
    ) => {
      try {
        const capabilities = await callService.getRouterCapabilities(data.conversationId)
        callback({ capabilities })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  socket.on(
    'createWebRtcTransport',
    async (data: { conversationId: number }, callback: (res: { params?: any; error?: string }) => void) => {
      try {
        const params = await callService.createWebRtcTransport(data.conversationId, accountId)
        callback({ params })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  socket.on(
    'connectTransport',
    async (
      data: { conversationId: number; transportId: string; dtlsParameters: DtlsParameters },
      callback: (res: { success?: boolean; error?: string }) => void
    ) => {
      try {
        await callService.connectTransport(data.conversationId, accountId, data.transportId, data.dtlsParameters)
        callback({ success: true })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  socket.on(
    'produce',
    async (
      data: {
        conversationId: number
        transportId: string
        kind: MediaKind
        rtpParameters: RtpParameters
        appData?: any
      },
      callback: (res: { id?: string; error?: string }) => void
    ) => {
      try {
        const producerId = await callService.produce(
          data.conversationId,
          accountId,
          data.transportId,
          data.kind,
          data.rtpParameters,
          data.appData
        )

        callback({ id: producerId })

        // Notify others in room that a new producer is ready to consume
        const callRoom = getCallRoom(data.conversationId)
        // Note: Broadcast to others in the room
        socket.to(callRoom).emit('newProducer', {
          producerId,
          accountId,
          kind: data.kind
        })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  socket.on(
    'consume',
    async (
      data: { conversationId: number; transportId: string; producerId: string; rtpCapabilities: RtpCapabilities },
      callback: (res: { params?: any; error?: string }) => void
    ) => {
      try {
        const params = await callService.consume(
          data.conversationId,
          accountId,
          data.transportId,
          data.producerId,
          data.rtpCapabilities
        )
        callback({ params })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  socket.on(
    'resumeConsumer',
    async (
      data: { conversationId: number; consumerId: string },
      callback: (res: { success?: boolean; error?: string }) => void
    ) => {
      try {
        await callService.resumeConsumer(data.conversationId, accountId, data.consumerId)
        callback({ success: true })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  // Advanced feature: Server-side pause
  socket.on(
    'pauseProducer',
    async (
      data: { conversationId: number; kind: MediaKind },
      callback: (res: { success?: boolean; error?: string }) => void
    ) => {
      try {
        await callService.pauseProducer(data.conversationId, accountId, data.kind)
        callback({ success: true })

        const callRoom = getCallRoom(data.conversationId)
        socket.to(callRoom).emit('producer-paused', { accountId, kind: data.kind })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  // Advanced feature: Server-side resume
  socket.on(
    'resumeProducer',
    async (
      data: { conversationId: number; kind: MediaKind },
      callback: (res: { success?: boolean; error?: string }) => void
    ) => {
      try {
        await callService.resumeProducer(data.conversationId, accountId, data.kind)
        callback({ success: true })

        const callRoom = getCallRoom(data.conversationId)
        socket.to(callRoom).emit('producer-resumed', { accountId, kind: data.kind })
      } catch (error: any) {
        callback({ error: error.message })
      }
    }
  )

  // We clear up resources if socket disconnects abruptly
  socket.on('disconnect', async () => {
    if (activeCallConversationId) {
      // The socket disconnected while in an active call
      const disconnectedConversationId = activeCallConversationId

      const callRoom = getCallRoom(disconnectedConversationId)

      // Notify everyone else in the room that this user ended the call / dropped
      socket.to(callRoom).emit('call-ended', {
        conversationId: disconnectedConversationId,
        endedById: accountId
      })

      // Cleanup Mediasoup resources for this peer
      callService.cleanupPeer(disconnectedConversationId, accountId)

      // Create call message on disconnect
      if (!callMessageCreated) {
        callMessageCreated = true
        const callStatus = callAccepted ? 'completed' : 'missed'
        const senderId = callerId ?? accountId
        try {
          const callMessage = await messageRepository.createCallMessage({
            conversationId: disconnectedConversationId,
            senderId,
            callMeta: { callType: callIsVideo ? 'video' : 'voice', callStatus: callStatus as any, durationSeconds: 0 }
          })
          await chatRepository.updateTimestamp(disconnectedConversationId)
          await emitNewMessage(fastify, disconnectedConversationId, callMessage, senderId)
        } catch (err) {
          console.error(chalk.red('❌ Error creating disconnect call message:'), err)
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.gray(`🔌 User ${accountId} disconnected, cleaned up call ${disconnectedConversationId}`))
      }

      activeCallConversationId = null
      callAccepted = false
      callerId = null
    }

    // Unsubscribe from callService events to prevent memory leaks
    callService.off('active-speaker', activeSpeakerListener)
  })
}
