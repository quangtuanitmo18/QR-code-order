import { chatRepository } from '@/repositories/chat.repository'
import { messageRepository } from '@/repositories/message.repository'
import { callService } from '@/services/call.service'
import { notificationService } from '@/services/notification.service'
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
  const accountId = (socket.handshake.auth.decodedAccessToken as any)?.userId as number

  if (!accountId) {
    fastify.log.error('[Call Socket] No accountId found')
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

      // Push Notification Logic for Call Ringing
      const notifyPromises = conversation.participants
        .filter((p: any) => p.accountId !== accountId)
        .map(async (p: any) => {
          const targetSocketRoom = `user-${p.accountId}`

          // Emit socket event to the user's room
          fastify.io.to(targetSocketRoom).emit('call-incoming', {
            conversationId,
            callerId: accountId,
            isVideo
          })

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
        })

      Promise.allSettled(notifyPromises).catch((err) => fastify.log.error('Error sending call notifications:', err))

      // Caller joins a dedicated call room
      const callRoom = getCallRoom(conversationId)
      await socket.join(callRoom)
      activeCallConversationId = conversationId
      callAccepted = false
      callIsVideo = isVideo
      callerId = accountId
      callMessageCreated = false

      if (process.env.NODE_ENV !== 'production') {
        fastify.log.info(`[Call] User ${accountId} is calling in conversation ${conversationId}`)
      }

      socket.emit('call-ringing', { conversationId })

      // Auto-decline/timeout after 60 seconds if not answered
      setTimeout(async () => {
        // Only timeout if the call is still active and hasn't been accepted or ended
        if (activeCallConversationId === conversationId && !callAccepted) {
          if (process.env.NODE_ENV !== 'production') {
            fastify.log.info(`[Call] Timeout in conversation ${conversationId}`)
          }

          // Notify caller and receiver that call missed/timed out
          fastify.io.to(callRoom).emit('call-ended', {
            conversationId,
            endedById: null,
            reason: 'timeout'
          })

          // Send silent notification to stop ringing
          const cancelPromises = conversation.participants
            .filter((p: any) => p.accountId !== accountId)
            .map((p: any) =>
              notificationService.sendSilentDataToAccount(p.accountId, {
                type: 'CALL_CANCELLED',
                conversationId: String(conversationId)
              })
            )
          Promise.allSettled(cancelPromises).catch((e) => fastify.log.error(e))

          // Create missed call message
          if (!callMessageCreated) {
            callMessageCreated = true
            try {
              const callMessage = await messageRepository.createCallMessage({
                conversationId,
                senderId: accountId,
                callMeta: { callType: isVideo ? 'video' : 'voice', callStatus: 'missed', durationSeconds: 0 }
              })
              await chatRepository.updateTimestamp(conversationId)
              await emitNewMessage(fastify, conversationId, callMessage, accountId)
            } catch (err) {
              fastify.log.error({ err }, '[Call] Error creating missed call message on timeout:')
            }
          }

          // Cleanup
          socket.leave(callRoom)
          callService.cleanupPeer(conversationId, accountId)

          activeCallConversationId = null
          callAccepted = false
          callerId = null
        }
      }, 60000)
    } catch (error: any) {
      fastify.log.error({ err: error }, '[Call] Error initiating call:')
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
        fastify.log.info(`[Call] User ${accountId} accepted call ${conversationId}`)
      }
    } catch (error: any) {
      fastify.log.error({ err: error }, '[Call] Error accepting call:')
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
            fastify.log.info(`[Call] Re-emitted call-incoming to user ${accountId} for conversation ${conversationId}`)
          }
        }
      }
    } catch (error: any) {
      fastify.log.error({ err: error }, '[Call] Error checking call:')
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
      const cancelPromises = conversation.participants
        .filter((p: any) => p.accountId !== accountId)
        .map((p: any) =>
          notificationService.sendSilentDataToAccount(p.accountId, {
            type: 'CALL_CANCELLED',
            conversationId: String(conversationId)
          })
        )

      Promise.allSettled(cancelPromises).catch((err) =>
        fastify.log.error('Error sending call cancelled notifications:', err)
      )

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
          fastify.log.error({ err }, '[Call] Error creating declined call message:')
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        fastify.log.info(`[Call] User ${accountId} declined call ${conversationId}`)
      }
    } catch (error: any) {
      fastify.log.error({ err: error }, '[Call] Error declining call:')
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
          fastify.log.error({ err }, '[Call] Error creating call message:')
        }
      }

      if (activeCallConversationId === conversationId) {
        activeCallConversationId = null
        callAccepted = false
        callerId = null
      }

      if (process.env.NODE_ENV !== 'production') {
        fastify.log.info(`[Call] User ${accountId} ended call ${conversationId}`)
      }
    } catch (error: any) {
      fastify.log.error({ err: error }, '[Call] Error ending call:')
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
          fastify.log.error({ err }, '[Call] Error creating disconnect call message:')
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        fastify.log.info(`[Socket] User ${accountId} disconnected, cleaned up call ${disconnectedConversationId}`)
      }

      activeCallConversationId = null
      callAccepted = false
      callerId = null
    }

    // Unsubscribe from callService events to prevent memory leaks
    callService.off('active-speaker', activeSpeakerListener)
  })
}
