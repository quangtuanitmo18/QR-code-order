import { ManagerRoom, Role } from '@/constants/type'
import prisma from '@/database'
import { AuthError } from '@/utils/errors'
import { verifyAccessToken } from '@/utils/jwt'
import fastifyPlugin from 'fastify-plugin'
import { registerCallSocketHandlers } from './call.socket'
import { registerChatSocketHandlers } from './chat.socket'

export const socketPlugin = fastifyPlugin(async (fastify) => {
  fastify.io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth

    if (!Authorization) {
      return next(new AuthError('Authorization token not found'))
    }
    const accessToken = Authorization.split(' ')[1]
    try {
      const decodedAccessToken = verifyAccessToken(accessToken)
      const { userId, role } = decodedAccessToken
      if (role === Role.Guest) {
        await prisma.socket.upsert({
          where: {
            guestId: userId
          },
          update: {
            socketId: socket.id
          },
          create: {
            guestId: userId,
            socketId: socket.id
          }
        })
        socket.join(`user-${userId}`)
      } else {
        await prisma.socket.upsert({
          where: {
            accountId: userId
          },
          update: {
            socketId: socket.id
          },
          create: {
            accountId: userId,
            socketId: socket.id
          }
        })
        socket.join(ManagerRoom)
        socket.join(`user-${userId}`)
      }
      socket.handshake.auth.decodedAccessToken = decodedAccessToken
    } catch (error: any) {
      return next(error)
    }
    next()
  })
  fastify.io.on('connection', async (socket) => {
    fastify.log.info(`[Socket] Connected: ${socket.id}`)

    // Register chat socket handlers
    registerChatSocketHandlers(fastify, socket)

    // Register call socket handlers
    registerCallSocketHandlers(fastify, socket)

    // Handle Tab Visibility (focus / blur)
    socket.on('client-visibility', ({ isFocused }: { isFocused: boolean }) => {
      socket.data = { ...socket.data, isFocused }
    })

    socket.on('disconnect', async (reason) => {
      fastify.log.info(`[Socket] Disconnected: ${socket.id}`)
    })
  })
})
