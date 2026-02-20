import { chatRepository } from '@/repositories/chat.repository'
import { callService } from '@/services/call.service'
import { getChalk } from '@/utils/helpers'
import type { FastifyInstance } from 'fastify'
import { types as mediasoupTypes } from 'mediasoup'
import { Socket } from 'socket.io'
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

  // Listener for active-speaker events from callService
  const activeSpeakerListener = (data: { conversationId: number, accountId: number | null, volume: number }) => {
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
      conversation.participants.forEach((p: { accountId: number }) => {
        if (p.accountId !== accountId) {
          // Assuming user sockets join a room like `user-${accountId}` (similar to chat plugin emits)
          fastify.io.to(`user-${p.accountId}`).emit('call-incoming', {
            conversationId,
            callerId: accountId,
            isVideo
          })
        }
      })

      // Caller joins a dedicated call room
      const callRoom = getCallRoom(conversationId)
      await socket.join(callRoom)
      activeCallConversationId = conversationId

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

      // Notify the person who initiated the call that it was accepted
      socket.to(callRoom).emit('call-accepted', {
        conversationId,
        responderId: accountId
      })

      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.greenBright(`📞 User ${accountId} accepted call in conversation ${conversationId}`))
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error accepting call:'), error)
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
  socket.on('call-end', async (data: { conversationId: number }) => {
    try {
      const { conversationId } = data
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
      
      if (activeCallConversationId === conversationId) {
        activeCallConversationId = null
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
    async (
      data: { conversationId: number },
      callback: (res: { params?: any; error?: string }) => void
    ) => {
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
      data: { conversationId: number; transportId: string; kind: MediaKind; rtpParameters: RtpParameters; appData?: any },
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

  socket.on('resumeConsumer', async (
    data: { conversationId: number; consumerId: string },
    callback: (res: { success?: boolean; error?: string }) => void
  ) => {
    try {
      await callService.resumeConsumer(data.conversationId, accountId, data.consumerId)
      callback({ success: true })
    } catch (error: any) {
      callback({ error: error.message })
    }
  })

  // Advanced feature: Server-side pause
  socket.on('pauseProducer', async (
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
  })

  // Advanced feature: Server-side resume
  socket.on('resumeProducer', async (
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
  })

  // We clear up resources if socket disconnects abruptly
  socket.on('disconnect', () => {
    if (activeCallConversationId) {
      // The socket disconnected while in an active call
      
      const callRoom = getCallRoom(activeCallConversationId)
      
      // Notify everyone else in the room that this user ended the call / dropped
      socket.to(callRoom).emit('call-ended', {
        conversationId: activeCallConversationId,
        endedById: accountId
      })

      // Cleanup Mediasoup resources for this peer
      callService.cleanupPeer(activeCallConversationId, accountId)

      if (process.env.NODE_ENV !== 'production') {
        console.log(chalk.gray(`🔌 User ${accountId} disconnected, cleaned up call ${activeCallConversationId}`))
      }
      
      activeCallConversationId = null
    }

    // Unsubscribe from callService events to prevent memory leaks
    callService.off('active-speaker', activeSpeakerListener)
  })
}
