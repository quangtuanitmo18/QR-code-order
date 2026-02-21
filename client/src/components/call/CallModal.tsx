'use client'

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
import { useAppStore } from '@/store/useAppStore'
import { useCallStore } from '@/store/useCallStore'
import { Loader2, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { VideoTile } from './VideoTile'

export function CallModal() {
  const socket = useAppStore((state) => state.socket)
  const {
    status,
    conversationId,
    isVideo,
    activeSpeakerId,
    setIncomingCall,
    setCallConnected,
    endCall,
    setActiveSpeakerId,
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
    remoteStreams,
  } = useMediasoup()

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [remoteVideoOff, setRemoteVideoOff] = useState(false)
  const [duration, setDuration] = useState(0)

  // Global socket listener for call signaling
  useEffect(() => {
    if (!socket) return

    const handleCallIncoming = (data: {
      conversationId: number
      callerId: number
      isVideo: boolean
    }) => {
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

    const handleActiveSpeaker = (data: {
      conversationId: number
      accountId: number | null
      volume: number
    }) => {
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
        setDuration((prev) => prev + 1)
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
          createRecvTransport(conversationId),
        ])

        if (sendTransport) {
          await produceLocalMedia(sendTransport, isVideo)
        }
      }
      setup()
    }
  }, [
    status,
    conversationId,
    isVideo,
    initDevice,
    createSendTransport,
    createRecvTransport,
    produceLocalMedia,
  ])

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

  // Listen for remote producer paused/resumed events
  useEffect(() => {
    if (!socket || status !== 'connected') return

    const handleProducerPaused = ({ kind }: { accountId: number; kind: string }) => {
      if (kind === 'video') setRemoteVideoOff(true)
    }
    const handleProducerResumed = ({ kind }: { accountId: number; kind: string }) => {
      if (kind === 'video') setRemoteVideoOff(false)
    }

    socket.on('producer-paused', handleProducerPaused)
    socket.on('producer-resumed', handleProducerResumed)

    return () => {
      socket.off('producer-paused', handleProducerPaused)
      socket.off('producer-resumed', handleProducerResumed)
    }
  }, [socket, status])

  // Cleanup when call ends
  useEffect(() => {
    if (status === 'idle') {
      cleanupHooks()
      setIsMuted(false)
      setIsVideoOff(false)
      setRemoteVideoOff(false)
    }
  }, [status, cleanupHooks])

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted))

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
      localStream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff))

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
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-lg duration-200 animate-in zoom-in-95">
          <div className="mb-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-10 w-10 animate-pulse text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Incoming Call...</h2>
          <p className="mb-8 mt-2 text-sm text-muted-foreground">Someone is calling you</p>
          <div className="flex justify-center gap-4">
            <Button
              variant="destructive"
              size="lg"
              className="h-14 w-14 rounded-full p-0 shadow-lg transition-transform hover:scale-105"
              onClick={declineCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="h-14 w-14 rounded-full bg-green-500 p-0 shadow-lg transition-transform hover:scale-105 hover:bg-green-600"
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
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-lg duration-200 animate-in zoom-in-95">
          <div className="mb-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-10 w-10 animate-bounce text-primary" />
            </div>
          </div>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">Calling...</h2>
          <div className="flex justify-center">
            <Button
              variant="destructive"
              size="lg"
              className="h-14 rounded-full px-8 shadow-lg transition-transform hover:scale-105"
              onClick={() => hangUp(duration)}
            >
              <PhoneOff className="mr-2 h-6 w-6" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Connected state (active call)
  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) hangUp(duration)
      }}
    >
      <DialogContent className="flex h-[100dvh] w-[100vw] flex-col overflow-hidden border-none bg-background p-0 shadow-2xl sm:h-[85vh] sm:max-w-4xl sm:rounded-2xl [&>button]:hidden">
        <DialogHeader className="z-10 flex flex-shrink-0 flex-row items-center justify-between space-y-0 border-b bg-background/95 p-4">
          <div>
            <DialogTitle>Active Call</DialogTitle>
            <DialogDescription>{formatDuration(duration)}</DialogDescription>
          </div>
          {/* <Button variant="destructive" size="sm" onClick={() => hangUp(duration)}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave
          </Button> */}
        </DialogHeader>

        <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-zinc-950">
          {/* Main Remote Area */}
          {remoteStreams.size > 0 ? (
            <div
              className={`absolute inset-0 transition-all duration-300 ${activeSpeakerId ? 'ring-4 ring-inset ring-primary' : ''}`}
            >
              <VideoTile
                stream={Array.from(remoteStreams.values())[0]}
                className={`h-full w-full object-cover ${isVideo && !remoteVideoOff ? '' : 'opacity-0'}`}
              />
              {(!isVideo || remoteVideoOff) && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                  <div
                    className={`flex h-32 w-32 items-center justify-center rounded-full bg-zinc-800 text-4xl text-zinc-500 shadow-xl transition-all duration-300 ${activeSpeakerId ? 'scale-110 ring-4 ring-primary' : ''}`}
                  >
                    {remoteVideoOff ? (
                      <VideoOff className="h-12 w-12" />
                    ) : (
                      <Mic className="h-12 w-12" />
                    )}
                  </div>
                  <p className="mt-6 text-xl font-medium text-white">
                    {remoteVideoOff ? 'Camera Off' : 'Voice Call'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center text-muted-foreground">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <p>Connecting media...</p>
            </div>
          )}

          {/* Picture-in-Picture Local Video (Only if Video Call) */}
          {isVideo && localStream && (
            <div className="absolute bottom-6 right-6 z-20 aspect-[3/4] w-32 overflow-hidden rounded-xl bg-zinc-900 shadow-2xl ring-2 ring-primary/30 md:aspect-video md:w-48">
              <VideoTile stream={localStream} isLocal className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <div className="z-30 flex flex-shrink-0 justify-center gap-6 border-t bg-background/95 p-4">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          {isVideo && (
            <Button
              variant={isVideoOff ? 'destructive' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full transition-transform hover:scale-105"
            onClick={() => hangUp(duration)}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
