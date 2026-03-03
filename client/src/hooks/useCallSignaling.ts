'use client'

import { useAppStore } from '@/store/useAppStore'
import { useCallStore } from '@/store/useCallStore'
import { useCallback } from 'react'

export function useCallSignaling() {
  const socket = useAppStore((state) => state.socket)
  const {
    status,
    conversationId,
    setIncomingCall,
    setOutgoingCall,
    setCallConnected,
    setActiveSpeakerId,
    endCall,
  } = useCallStore()

  // 1. Initiate a call
  const startCall = useCallback(
    (convId: number, isVideo: boolean = true) => {
      if (socket?.connected) {
        setOutgoingCall(convId, isVideo)
        socket.emit('call-request', { conversationId: convId, isVideo })
      }
    },
    [socket, setOutgoingCall]
  )

  // 2. Accept an incoming call
  const acceptCall = useCallback(() => {
    if (socket?.connected && conversationId) {
      socket.emit('call-accept', { conversationId })
      setCallConnected()
    }
  }, [socket, conversationId, setCallConnected])

  // 3. Decline an incoming call
  const declineCall = useCallback(() => {
    if (socket?.connected && conversationId) {
      socket.emit('call-decline', { conversationId })
      endCall()
    }
  }, [socket, conversationId, endCall])

  // 4. Hang up an active or ringing call
  const hangUp = useCallback(
    (durationSeconds?: number) => {
      if (socket?.connected && conversationId) {
        socket.emit('call-end', { conversationId, durationSeconds: durationSeconds ?? 0 })
        endCall()
      }
    },
    [socket, conversationId, endCall]
  )

  // Provide actions to components
  return {
    status,
    conversationId,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
  }
}
