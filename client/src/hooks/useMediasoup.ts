'use client'

import { useAppStore } from '@/store/useAppStore'
import { Device } from 'mediasoup-client'
import { useCallback, useRef, useState } from 'react'

export function useMediasoup() {
  const socket = useAppStore((state) => state.socket)
  
  const deviceRef = useRef<Device | null>(null)
  
  // Transports
  const sendTransportRef = useRef<any>(null)
  const recvTransportRef = useRef<any>(null)

  // Local Media
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  
  // Remote Media
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())

  // Loading states
  const [deviceLoaded, setDeviceLoaded] = useState(false)

  /**
   * Initialize the Mediasoup Device by getting Router Capabilities
   */
  const initDevice = useCallback(async (conversationId: number) => {
    if (!socket?.connected) return false

    try {
      // 1. Get Router capabilities
      const routerRtpCapabilities = await new Promise<any>((resolve, reject) => {
        socket.emit('getRouterRtpCapabilities', { conversationId }, (res: any) => {
          if (res.error) return reject(res.error)
          resolve(res.capabilities)
        })
      })

      // 2. Load the device
      const device = new Device()
      await device.load({ routerRtpCapabilities })
      deviceRef.current = device
      setDeviceLoaded(true)
      console.log('Mediasoup Device loaded!')

      return true
    } catch (error) {
      console.error('Failed to init Mediasoup device:', error)
      return false
    }
  }, [socket])

  /**
   * Create a Send Transport to produce media
   */
  const createSendTransport = useCallback(async (conversationId: number) => {
    if (!socket?.connected || !deviceRef.current) return null

    try {
      const params = await new Promise<any>((resolve, reject) => {
        socket.emit('createWebRtcTransport', { conversationId }, (res: any) => {
          if (res.error) return reject(res.error)
          resolve(res.params)
        })
      })

      const sendTransport = deviceRef.current.createSendTransport(params)

      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await new Promise<void>((resolve, reject) => {
            socket.emit('connectTransport', {
              conversationId,
              transportId: sendTransport.id,
              dtlsParameters
            }, (res: any) => {
              if (res.error) return reject(res.error)
              resolve()
            })
          })
          callback()
        } catch (error: any) {
          errback(error)
        }
      })

      sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const { id } = await new Promise<any>((resolve, reject) => {
            socket.emit('produce', {
              conversationId,
              transportId: sendTransport.id,
              kind,
              rtpParameters,
              appData
            }, (res: any) => {
              if (res.error) return reject(res.error)
              resolve(res)
            })
          })
          callback({ id })
        } catch (error: any) {
          errback(error)
        }
      })

      sendTransportRef.current = sendTransport
      return sendTransport

    } catch (error) {
      console.error('Failed to create send transport:', error)
      return null
    }
  }, [socket])

  /**
   * Create a Recv Transport to consume media
   */
  const createRecvTransport = useCallback(async (conversationId: number) => {
    if (!socket?.connected || !deviceRef.current) return null

    try {
      const params = await new Promise<any>((resolve, reject) => {
        socket.emit('createWebRtcTransport', { conversationId }, (res: any) => {
          if (res.error) return reject(res.error)
          resolve(res.params)
        })
      })

      const recvTransport = deviceRef.current.createRecvTransport(params)

      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await new Promise<void>((resolve, reject) => {
            socket.emit('connectTransport', {
              conversationId,
              transportId: recvTransport.id,
              dtlsParameters
            }, (res: any) => {
              if (res.error) return reject(res.error)
              resolve()
            })
          })
          callback()
        } catch (error: any) {
          errback(error)
        }
      })

      recvTransportRef.current = recvTransport
      return recvTransport

    } catch (error) {
      console.error('Failed to create recv transport:', error)
      return null
    }
  }, [socket])


  /**
   * Get Local Media Stream and produce taking it
   */
  const produceLocalMedia = useCallback(async (sendTransport: any, isVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      })
      setLocalStream(stream)

      // Produce Audio
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        await sendTransport.produce({ track: audioTrack, appData: { source: 'mic' } })
      }

      // Produce Video (with Simulcast)
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        await sendTransport.produce({ 
          track: videoTrack, 
          encodings: [
            { maxBitrate: 100000, scaleResolutionDownBy: 4 }, // Low quality
            { maxBitrate: 300000, scaleResolutionDownBy: 2 }, // Medium quality
            { maxBitrate: 900000, scaleResolutionDownBy: 1 }  // High quality
          ],
          codecOptions: {
            videoGoogleStartBitrate: 1000
          },
          appData: { source: 'webcam' } 
        })
      }

      return stream
    } catch (error) {
      console.error('Failed to get local media:', error)
      return null
    }
  }, [])

  /**
   * Consume a remote producer
   */
  const consumeRemoteMedia = useCallback(async (conversationId: number, producerId: string) => {
    const recvTransport = recvTransportRef.current
    const device = deviceRef.current

    if (!recvTransport || !device || !socket?.connected) return

    try {
      const { params } = await new Promise<any>((resolve, reject) => {
        socket.emit('consume', {
          conversationId,
          transportId: recvTransport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities
        }, (res: any) => {
          if (res.error) return reject(res.error)
          resolve(res)
        })
      })

      const consumer = await recvTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      })

      // Add to remote streams (we map by accountId if possible, for 1:1 we can just use a "remote" key)
      setRemoteStreams(prev => {
        const next = new Map(prev)
        let stream = next.get('remote')
        if (!stream) stream = new MediaStream()
        
        stream.addTrack(consumer.track)
        next.set('remote', stream)
        return next
      })

      // Server starts consumer paused to avoid dropping packets, we must resume
      socket.emit('resumeConsumer', { conversationId, consumerId: consumer.id }, () => {})
      
    } catch (error) {
      console.error('Failed to consume media:', error)
    }
  }, [socket])

  /**
   * Pause a producer (audio or video) on the server
   */
  const pauseProducer = useCallback(async (conversationId: number, kind: 'audio' | 'video') => {
    if (!socket?.connected) return
    try {
      await new Promise<void>((resolve, reject) => {
        socket.emit('pauseProducer', { conversationId, kind }, (res: any) => {
          if (res.error) return reject(res.error)
          resolve()
        })
      })
    } catch (error) {
      console.error(`Failed to pause ${kind} producer:`, error)
    }
  }, [socket])

  /**
   * Resume a producer on the server
   */
  const resumeProducer = useCallback(async (conversationId: number, kind: 'audio' | 'video') => {
    if (!socket?.connected) return
    try {
      await new Promise<void>((resolve, reject) => {
        socket.emit('resumeProducer', { conversationId, kind }, (res: any) => {
          if (res.error) return reject(res.error)
          resolve()
        })
      })
    } catch (error) {
      console.error(`Failed to resume ${kind} producer:`, error)
    }
  }, [socket])

  const cleanupHooks = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    setRemoteStreams(new Map())
    if (sendTransportRef.current) sendTransportRef.current.close()
    if (recvTransportRef.current) recvTransportRef.current.close()
    setDeviceLoaded(false)
  }, [localStream])

  return {
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
  }
}
