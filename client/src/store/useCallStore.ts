import { create } from 'zustand'

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected'

type CallStoreType = {
  status: CallStatus
  conversationId: number | null
  callerId: number | null       // ID of the person who initiated the call
  responderId: number | null    // ID of the person who accepted the call
  isVideo: boolean
  activeSpeakerId: number | null
  
  // Actions
  setActiveSpeakerId: (accountId: number | null) => void
  setIncomingCall: (conversationId: number, callerId: number, isVideo: boolean) => void
  setOutgoingCall: (conversationId: number, isVideo: boolean) => void
  setCallConnected: (responderId?: number) => void
  endCall: () => void
}

export const useCallStore = create<CallStoreType>((set) => ({
  status: 'idle',
  conversationId: null,
  callerId: null,
  responderId: null,
  isVideo: false,
  activeSpeakerId: null,

  setActiveSpeakerId: (accountId) => set({ activeSpeakerId: accountId }),

  setIncomingCall: (conversationId, callerId, isVideo) => 
    set({ status: 'ringing', conversationId, callerId, isVideo, responderId: null }),
    
  setOutgoingCall: (conversationId, isVideo) => 
    set({ status: 'calling', conversationId, isVideo, callerId: null, responderId: null }),

  setCallConnected: (responderId) => 
    set((state) => ({ status: 'connected', responderId: responderId ?? state.responderId })),

  endCall: () => 
    set({ status: 'idle', conversationId: null, callerId: null, responderId: null, isVideo: false, activeSpeakerId: null })
}))
