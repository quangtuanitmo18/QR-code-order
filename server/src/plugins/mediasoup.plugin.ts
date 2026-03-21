import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import * as mediasoup from 'mediasoup'
import { types as mediasoupTypes } from 'mediasoup'
import os from 'os'
type Worker = mediasoupTypes.Worker
type RouterOptions = mediasoupTypes.RouterOptions
type WebRtcTransportOptions = mediasoupTypes.WebRtcTransportOptions

// Store workers globally
const workers: Worker[] = []
let nextMediasoupWorkerIdx = 0

// Standard mediasoup configuration
export const mediasoupConfig = {
  worker: {
    rtcMinPort: 20000,
    rtcMaxPort: 30000,
    logLevel: 'warn' as mediasoup.types.WorkerLogLevel,
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as mediasoup.types.WorkerLogTag[]
  },
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000
        }
      },
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
          'profile-id': 2,
          'x-google-start-bitrate': 1000
        }
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000
        }
      }
    ] as mediasoup.types.RtpCodecCapability[]
  },
  webRtcTransport: {
    listenIps: [
      {
        // Bind to all interfaces
        ip: '0.0.0.0',
        // In production, this should ideally be the public IP of the server
        // Using an env variable or an external IP discovery service
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1'
      }
    ],
    initialAvailableOutgoingBitrate: 1000000,
    minimumAvailableOutgoingBitrate: 600000,
    maxSctpMessageSize: 262144,
    // Enable DataChannels (optional but good for future ping/pong or chat)
    enableUdp: true,
    enableTcp: true,
    preferUdp: true
  }
}

/**
 * Create a specialized pool of Mediasoup workers
 */
async function createWorkers(fastify: FastifyInstance) {
  const numWorkers = Object.keys(os.cpus()).length

  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: mediasoupConfig.worker.logLevel,
      logTags: mediasoupConfig.worker.logTags,
      rtcMinPort: mediasoupConfig.worker.rtcMinPort,
      rtcMaxPort: mediasoupConfig.worker.rtcMaxPort
    })

    worker.on('died', () => {
      fastify.log.error(`Worker ${worker.pid} died! Exiting process...`)
      // It's serious if a worker dies, typically we should crash and let process manager restart
      process.exit(1)
    })

    workers.push(worker)
  }

  fastify.log.info(`[Mediasoup] Initialized ${numWorkers} workers successfully`)
}

/**
 * Get the next worker in a Round-Robin fashion
 */
export function getMediasoupWorker(): Worker {
  const worker = workers[nextMediasoupWorkerIdx]
  if (++nextMediasoupWorkerIdx === workers.length) {
    nextMediasoupWorkerIdx = 0
  }
  return worker
}

export const mediasoupPlugin = fastifyPlugin(async (fastify) => {
  try {
    await createWorkers(fastify)
    // Extend Fastify instance to easily access getMediasoupWorker if needed
    fastify.decorate('getMediasoupWorker', getMediasoupWorker)
  } catch (err) {
    fastify.log.warn(
      '[Mediasoup] Failed to initialize workers (native binary may not be built). ' +
        'Video call features will be unavailable. Error: ' +
        (err instanceof Error ? err.message : String(err))
    )
    // Decorate with a stub so other plugins don't crash
    fastify.decorate('getMediasoupWorker', () => {
      throw new Error('Mediasoup workers not available — native binary not built')
    })
  }
})
