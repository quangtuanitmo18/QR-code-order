import { TokenPayload } from '@/types/jwt.types'
import { Account } from '@prisma/client'
import { type FastifyRequest, FastifyInstance, FastifyReply } from 'fastify'
import type { Server } from 'socket.io'
declare global {
  interface BigInt {
    toJSON(): string
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
  interface FastifyRequest {
    decodedAccessToken?: TokenPayload
  }
}
