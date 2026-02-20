import { getMediasoupWorker, mediasoupConfig } from '@/plugins/mediasoup.plugin'
import { EventEmitter } from 'events'
import { types as mediasoupTypes } from 'mediasoup'

type Router = mediasoupTypes.Router
type WebRtcTransport = mediasoupTypes.WebRtcTransport
type Producer = mediasoupTypes.Producer
type Consumer = mediasoupTypes.Consumer
type RtpCodecCapability = mediasoupTypes.RtpCodecCapability
type DtlsParameters = mediasoupTypes.DtlsParameters
type RtpCapabilities = mediasoupTypes.RtpCapabilities
type MediaKind = mediasoupTypes.MediaKind
type RtpParameters = mediasoupTypes.RtpParameters

// In-memory mapping
// A Room correlates to a ConversationId
interface RoomState {
  router: Router
  audioLevelObserver: mediasoupTypes.AudioLevelObserver
  peers: Map<number, PeerState>
}

interface PeerState {
  accountId: number
  transports: Map<string, WebRtcTransport>
  producers: Map<string, Producer>
  consumers: Map<string, Consumer>
}

class CallService extends EventEmitter {
  // Store rooms: conversationId -> RoomState
  private rooms = new Map<number, RoomState>()

  /**
   * Get or create a Room (Router) for a conversation
   */
  async getOrCreateRoom(conversationId: number): Promise<RoomState> {
    const existingRoom = this.rooms.get(conversationId)
    if (existingRoom) {
      return existingRoom
    }

    const worker = getMediasoupWorker()
    // Create a Router with our predefined codecs
    const router = await worker.createRouter({
      mediaCodecs: mediasoupConfig.router.mediaCodecs
    })

    // Create an AudioLevelObserver for Active Speaker Detection
    const audioLevelObserver = await router.createAudioLevelObserver({
      maxEntries: 1,
      threshold: -80,
      interval: 1000
    })

    audioLevelObserver.on('volumes', (volumes) => {
      const { producer, volume } = volumes[0]
      // producer.appData contains the accountId we injected when producing
      this.emit('active-speaker', {
        conversationId,
        accountId: producer.appData.accountId,
        volume
      })
    })

    audioLevelObserver.on('silence', () => {
      this.emit('active-speaker', {
        conversationId,
        accountId: null,
        volume: -100
      })
    })

    const newRoom: RoomState = {
      router,
      audioLevelObserver,
      peers: new Map<number, PeerState>()
    }

    this.rooms.set(conversationId, newRoom)
    return newRoom
  }

  /**
   * Get Router capabilities (sent to client device)
   */
  async getRouterCapabilities(conversationId: number): Promise<RtpCapabilities> {
    const room = await this.getOrCreateRoom(conversationId)
    return room.router.rtpCapabilities
  }

  /**
   * Get or register a Peer (User)
   */
  getOrCreatePeer(room: RoomState, accountId: number): PeerState {
    let peer = room.peers.get(accountId)
    if (!peer) {
      peer = {
        accountId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
      }
      room.peers.set(accountId, peer)
    }
    return peer
  }

  /**
   * Create a WebRTC transport for a peer (either send or recv)
   */
  async createWebRtcTransport(conversationId: number, accountId: number) {
    const room = await this.getOrCreateRoom(conversationId)
    const peer = this.getOrCreatePeer(room, accountId)

    const transport = await room.router.createWebRtcTransport({
      listenIps: mediasoupConfig.webRtcTransport.listenIps,
      enableUdp: mediasoupConfig.webRtcTransport.enableUdp,
      enableTcp: mediasoupConfig.webRtcTransport.enableTcp,
      preferUdp: mediasoupConfig.webRtcTransport.preferUdp,
      initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
    })

    // Handle max bitrate limit
    await transport.setMaxIncomingBitrate(1500000) // 1.5 Mbps limit per transport for safety

    transport.on('dtlsstatechange', dtlsState => {
      if (dtlsState === 'closed') {
        transport.close()
      }
    })

    // Store the transport
    peer.transports.set(transport.id, transport)

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters
    }
  }

  /**
   * Connect transport with DTLS paremeters derived from the client
   */
  async connectTransport(conversationId: number, accountId: number, transportId: string, dtlsParameters: DtlsParameters) {
    const room = this.rooms.get(conversationId)
    if (!room) throw new Error('Room not found')
    
    const peer = room.peers.get(accountId)
    if (!peer) throw new Error('Peer not found')
    
    const transport = peer.transports.get(transportId)
    if (!transport) throw new Error('Transport not found')

    await transport.connect({ dtlsParameters })
  }

  /**
   * Produce media (client sending video/audio to router)
   */
  async produce(
    conversationId: number,
    accountId: number,
    transportId: string,
    kind: MediaKind,
    rtpParameters: RtpParameters,
    appData?: any
  ) {
    const room = this.rooms.get(conversationId)
    if (!room) throw new Error('Room not found')
    
    const peer = room.peers.get(accountId)
    if (!peer) throw new Error('Peer not found')
    
    const transport = peer.transports.get(transportId)
    if (!transport) throw new Error('Transport not found')

    const producer = await transport.produce({
      kind,
      rtpParameters,
      appData: { ...appData, accountId }
    })

    peer.producers.set(producer.id, producer)

    if (kind === 'audio') {
      await room.audioLevelObserver.addProducer({ producerId: producer.id })
    }

    producer.on('transportclose', () => {
      producer.close()
      peer.producers.delete(producer.id)
    })

    return producer.id
  }

  /**
   * Consume media (client receiving video/audio from router via another peer's producer)
   */
  async consume(
    conversationId: number,
    accountId: number,
    transportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities
  ) {
    const room = this.rooms.get(conversationId)
    if (!room) throw new Error('Room not found')
    
    const peer = room.peers.get(accountId)
    if (!peer) throw new Error('Peer not found')

    const transport = peer.transports.get(transportId)
    if (!transport) throw new Error('Transport not found')

    // Check if router can consume the requested producer
    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Cannot consume producer ${producerId}`)
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true // Must be resumed from client to avoid dropping initial packets
    })

    peer.consumers.set(consumer.id, consumer)

    consumer.on('transportclose', () => {
      consumer.close()
      peer.consumers.delete(consumer.id)
    })

    consumer.on('producerclose', () => {
      consumer.close()
      peer.consumers.delete(consumer.id)
       // we should ideally notify the client via socket when this happens organically
    })

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters
    }
  }

  async resumeConsumer(conversationId: number, accountId: number, consumerId: string) {
    const room = this.rooms.get(conversationId)
    if (!room) throw new Error('Room not found')
    const peer = room.peers.get(accountId)
    if (!peer) throw new Error('Peer not found')

    const consumer = peer.consumers.get(consumerId)
    if (!consumer) throw new Error('Consumer not found')

    await consumer.resume()
  }

  /**
   * Pause a specific producer (Server-side Pause)
   */
  async pauseProducer(conversationId: number, accountId: number, kind: MediaKind) {
    const room = this.rooms.get(conversationId)
    if (!room) return

    const peer = room.peers.get(accountId)
    if (!peer) return

    // Find the producer matching the kind (audio/video)
    const producer = Array.from(peer.producers.values()).find(p => p.kind === kind)
    if (producer) {
      await producer.pause()
    }
  }

  /**
   * Resume a specific producer
   */
  async resumeProducer(conversationId: number, accountId: number, kind: MediaKind) {
    const room = this.rooms.get(conversationId)
    if (!room) return

    const peer = room.peers.get(accountId)
    if (!peer) return

    const producer = Array.from(peer.producers.values()).find(p => p.kind === kind)
    if (producer) {
      await producer.resume()
    }
  }

  /**
   * Cleanup everything for a conversation
   */
  cleanupRoom(conversationId: number) {
    const room = this.rooms.get(conversationId)
    if (!room) return

    // Close all transports = closes all producers and consumers associated
    Array.from(room.peers.values()).forEach((peer) => {
      Array.from(peer.transports.values()).forEach(t => t.close())
    })

    room.router.close()
    this.rooms.delete(conversationId)
  }

  /**
   * Cleanup for a specific user moving away
   */
  cleanupPeer(conversationId: number, accountId: number) {
    const room = this.rooms.get(conversationId)
    if (!room) return

    const peer = room.peers.get(accountId)
    if (!peer) return

    Array.from(peer.transports.values()).forEach(t => t.close())
    room.peers.delete(accountId)

    // If room is empty, drop router
    if (room.peers.size === 0) {
      this.cleanupRoom(conversationId)
    }
  }
}

export const callService = new CallService()
