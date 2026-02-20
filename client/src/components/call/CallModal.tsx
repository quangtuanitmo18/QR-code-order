'use client'

import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useCallSignaling } from '@/hooks/useCallSignaling'
import { useMediasoup } from '@/hooks/useMediasoup'
import { useCallStore } from '@/store/useCallStore'
import { Loader2, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { VideoTile } from './VideoTile'

export function CallModal() {
  const socket = useAppStore(state => state.socket)
  const { 
    status, 
    conversationId, 
    isVideo, 
    activeSpeakerId,
    setIncomingCall,
    setCallConnected,
    endCall,
    setActiveSpeakerId
  } = useCallStore()
  const { acceptCall, declineCall, hangUp } = useCallSignaling()

  const {
    initDevice,
    deviceLoaded,
    createSendTransport,
    createRecvTransport,
    produceLocalMedia,
    consumeRemoteMedia,
    pauseProducer,
    resumeProducer,
    cleanupHooks,
    localStream,
    remoteStreams
  } = useMediasoup()

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(!isVideo)
  const [duration, setDuration] = useState(0)

  // Global socket listener for call signaling
  useEffect(() => {
    if (!socket) return

    const handleCallIncoming = (data: { conversationId: number; callerId: number; isVideo: boolean }) => {
      // Only accept incoming call if we are idle (don't interrupt existing calls)
      if (useCallStore.getState().status === 'idle') {
        setIncomingCall(data.conversationId, data.callerId, data.isVideo)
      } else {
        // Automatically decline if busy
        socket.emit('call-decline', { conversationId: data.conversationId, reason: 'busy' })
      }
    }

    const handleCallAccepted = (data: { conversationId: number; responderId: number }) => {
      const currentConv = useCallStore.getState().conversationId
      if (currentConv === data.conversationId) {
        setCallConnected(data.responderId)
      }
    }

    const handleCallDeclined = (data: { conversationId: number }) => {
      const currentConv = useCallStore.getState().conversationId
      if (currentConv === data.conversationId) {
        console.log('Call was declined')
        endCall()
      }
    }

    const handleCallEnded = (data: { conversationId: number }) => {
      const currentConv = useCallStore.getState().conversationId
      if (currentConv === data.conversationId) {
        endCall()
      }
    }

    const handleActiveSpeaker = (data: { conversationId: number, accountId: number | null, volume: number }) => {
      const currentConv = useCallStore.getState().conversationId
      if (currentConv === data.conversationId) {
        setActiveSpeakerId(data.accountId)
      }
    }

    socket.on('call-incoming', handleCallIncoming)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('call-declined', handleCallDeclined)
    socket.on('call-ended', handleCallEnded)
    socket.on('active-speaker', handleActiveSpeaker)

    return () => {
      socket.off('call-incoming', handleCallIncoming)
      socket.off('call-accepted', handleCallAccepted)
      socket.off('call-declined', handleCallDeclined)
      socket.off('call-ended', handleCallEnded)
      socket.off('active-speaker', handleActiveSpeaker)
    }
  }, [socket, setIncomingCall, setCallConnected, setActiveSpeakerId, endCall])

  // Timer for connected state
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } else {
      setDuration(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Initialization when connected
  useEffect(() => {
    if (status === 'connected' && conversationId) {
      const setup = async () => {
        const hasDevice = await initDevice(conversationId)
        if (!hasDevice) return

        const [sendTransport, recvTransport] = await Promise.all([
          createSendTransport(conversationId),
          createRecvTransport(conversationId)
        ])

        if (sendTransport) {
          await produceLocalMedia(sendTransport, isVideo)
        }
      }
      setup()
    }
  }, [status, conversationId, isVideo, initDevice, createSendTransport, createRecvTransport, produceLocalMedia])

  // Listen for new remote producers
  useEffect(() => {
    if (!socket || status !== 'connected' || !deviceLoaded || !conversationId) return

    const handleNewProducer = async ({ producerId, accountId, kind }: any) => {
      console.log('New remote producer available!', producerId, kind)
      await consumeRemoteMedia(conversationId, producerId)
    }

    socket.on('newProducer', handleNewProducer)

    return () => {
      socket.off('newProducer', handleNewProducer)
    }
  }, [socket, status, deviceLoaded, conversationId, consumeRemoteMedia])

  // Cleanup when call ends
  useEffect(() => {
    if (status === 'idle') {
      cleanupHooks()
      setIsMuted(false)
      setIsVideoOff(!isVideo)
    }
  }, [status, cleanupHooks, isVideo])

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isMuted)
      
      // Server-side Pause/Resume
      if (conversationId) {
        if (!isMuted) {
          pauseProducer(conversationId, 'audio')
        } else {
          resumeProducer(conversationId, 'audio')
        }
      }
      
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = isVideoOff)
      
      // Server-side Pause/Resume
      if (conversationId) {
        if (!isVideoOff) {
          pauseProducer(conversationId, 'video')
        } else {
          resumeProducer(conversationId, 'video')
        }
      }
      
      setIsVideoOff(!isVideoOff)
    }
  }

  // Do not render anything if idle
  if (status === 'idle') return null

  // Ringing state (incoming call)
  if (status === 'ringing') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-card w-full max-w-sm rounded-lg p-6 shadow-lg border text-center animate-in zoom-in-95 duration-200">
          <div className="mb-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Incoming Call...</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-8">
            Someone is calling you
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-14 p-0 shadow-lg hover:scale-105 transition-transform"
              onClick={declineCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="bg-green-500 hover:bg-green-600 rounded-full h-14 w-14 p-0 shadow-lg hover:scale-105 transition-transform"
              onClick={acceptCall}
            >
              <Phone className="h-6 w-6 fill-current" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calling state (outgoing call ringing)
  if (status === 'calling') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-card w-full max-w-sm rounded-lg p-6 shadow-lg border text-center animate-in zoom-in-95 duration-200">
           <div className="mb-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-10 w-10 text-primary animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-8">Calling...</h2>
          <div className="flex justify-center">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 px-8 shadow-lg hover:scale-105 transition-transform"
              onClick={hangUp}
            >
              <PhoneOff className="h-6 w-6 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Connected state (active call)
  return (
    <Dialog open={true} onOpenChange={(open) => { if(!open) hangUp() }}>
      <DialogContent className="w-[100vw] h-[100dvh] sm:h-[85vh] sm:max-w-4xl p-0 flex flex-col overflow-hidden bg-background border-none sm:rounded-2xl shadow-2xl [&>button]:hidden">
        <DialogHeader className="p-4 bg-background/95 z-10 border-b flex-shrink-0 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle>Active Call</DialogTitle>
            <DialogDescription>
              {formatDuration(duration)}
            </DialogDescription>
          </div>
          <Button variant="destructive" size="sm" onClick={hangUp}>
            <PhoneOff className="h-4 w-4 mr-2" />
            Leave
          </Button>
        </DialogHeader>

        <div className="flex-1 bg-zinc-950 relative flex items-center justify-center overflow-hidden w-full h-full">
          {/* Main Remote Area */}
          {remoteStreams.size > 0 ? (
            <div className={`absolute inset-0 transition-all duration-300 ${activeSpeakerId ? 'ring-4 ring-primary ring-inset' : ''}`}>
              <VideoTile 
                stream={Array.from(remoteStreams.values())[0]} 
                className={`h-full w-full object-cover ${isVideo ? '' : 'opacity-0'}`} // Hide video element visually if audio only, but keep stream for audio playback
              />
              {!isVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 pointer-events-none">
                  <div className={`h-32 w-32 rounded-full bg-zinc-800 flex items-center justify-center text-4xl text-zinc-500 shadow-xl transition-all duration-300 ${activeSpeakerId ? 'ring-4 ring-primary scale-110' : ''}`}>
                    <Mic className="h-12 w-12" />
                  </div>
                  <p className="mt-6 text-xl font-medium text-white">Voice Call</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p>Connecting media...</p>
            </div>
          )}

          {/* Picture-in-Picture Local Video (Only if Video Call) */}
          {isVideo && localStream && (
            <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-[3/4] md:aspect-video rounded-xl overflow-hidden shadow-2xl bg-zinc-900 ring-2 ring-primary/30 z-20">
              <VideoTile stream={localStream} isLocal className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <div className="p-4 bg-background/95 border-t flex-shrink-0 flex justify-center gap-6 z-30">
          <Button 
            variant={isMuted ? "destructive" : "secondary"} 
            size="icon" 
            className="rounded-full h-12 w-12"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button 
            variant={isVideoOff ? "destructive" : "secondary"} 
            size="icon" 
            className="rounded-full h-12 w-12"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
          <Button variant="destructive" size="icon" className="rounded-full h-12 w-12 hover:scale-105 transition-transform" onClick={hangUp}>
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
