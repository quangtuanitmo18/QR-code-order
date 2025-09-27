// src/index.ts
import envConfig, { API_URL } from '@/config'
import { initOwnerAccount } from '@/controllers/account.controller'
import autoRemoveRefreshTokenJob from '@/jobs/autoRemoveRefreshToken.job'
import { errorHandlerPlugin } from '@/plugins/errorHandler.plugins'
import { socketPlugin } from '@/plugins/socket.plugins'
import validatorCompilerPlugin from '@/plugins/validatorCompiler.plugins'

import accountRoutes from '@/routes/account.route'
import authRoutes from '@/routes/auth.route'
import dishRoutes from '@/routes/dish.route'
import guestRoutes from '@/routes/guest.route'
import indicatorRoutes from '@/routes/indicator.route'
import mediaRoutes from '@/routes/media.route'
import orderRoutes from '@/routes/order.route'
import staticRoutes from '@/routes/static.route'
import tablesRoutes from '@/routes/table.route'
import testRoutes from '@/routes/test.route'

import { createFolder } from '@/utils/helpers'
import fastifyAuth from '@fastify/auth'
import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import Fastify from 'fastify'
import fastifySocketIO from 'fastify-socket.io'
import path from 'path'

const fastify = Fastify({
  logger: true,

  trustProxy: true
})

// Healthcheck API
fastify.get('/healthz', async () => ({ ok: true }))

// hold a reference to the job stopper
let stopRefreshTokenJob: (() => void) | undefined

async function start() {
  try {
    // set up necessary folders
    createFolder(path.resolve(envConfig.UPLOAD_FOLDER))

    stopRefreshTokenJob = (autoRemoveRefreshTokenJob as any)?.() ?? undefined

    // CORS
    const corsOrigin =
      !envConfig.CLIENT_URL || envConfig.CLIENT_URL === '*'
        ? true
        : envConfig.CLIENT_URL.split(',').map((s: string) => s.trim())

    await fastify.register(cors, {
      origin: corsOrigin,
      credentials: true
    })

    // Security & other
    await fastify.register(fastifyAuth, { defaultRelation: 'and' })
    await fastify.register(fastifyHelmet, {
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
    await fastify.register(fastifyCookie)
    await fastify.register(validatorCompilerPlugin)
    await fastify.register(errorHandlerPlugin)

    // Socket.IO
    await fastify.register(fastifySocketIO, {
      cors: { origin: corsOrigin }
    })
    await fastify.register(socketPlugin)

    // Routes
    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(accountRoutes, { prefix: '/accounts' })
    await fastify.register(mediaRoutes, { prefix: '/media' })
    await fastify.register(staticRoutes, { prefix: '/static' })
    await fastify.register(dishRoutes, { prefix: '/dishes' })
    await fastify.register(tablesRoutes, { prefix: '/tables' })
    await fastify.register(orderRoutes, { prefix: '/orders' })
    await fastify.register(testRoutes, { prefix: '/test' })
    await fastify.register(guestRoutes, { prefix: '/guest' })
    await fastify.register(indicatorRoutes, { prefix: '/indicators' })

    // Init dữ liệu
    await initOwnerAccount()

    // Start server
    await fastify.listen({
      port: envConfig.PORT,
      host: '0.0.0.0'
    })

    // notify PM2 or systemd that we are ready
    if (process.send) process.send('ready')

    fastify.log.info(`Server listening on ${API_URL}`)
  } catch (err) {
    fastify.log.error(err)
    // exit the process with error
    process.exit(1)
  }
}

// Graceful shutdown: đóng socket, job, và fastify
async function shutdown(signal: NodeJS.Signals) {
  try {
    fastify.log.info({ signal }, 'Shutting down gracefully...')

    if (fastify.io && typeof fastify.io.close === 'function') {
      fastify.io.close()
    }

    if (typeof stopRefreshTokenJob === 'function') {
      stopRefreshTokenJob()
    }
    await fastify.close()
    process.exit(0)
  } catch (e) {
    fastify.log.error(e)
    process.exit(1)
  }
}

// catch  SIGINT and SIGTERM and shutdown gracefully via PM2/systemd
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// catch unhandled errors, log them and exit
process.on('unhandledRejection', (reason) => {
  fastify.log.error({ reason }, 'Unhandled Rejection')
  process.exit(1)
})
process.on('uncaughtException', (err) => {
  fastify.log.error(err, 'Uncaught Exception')
  process.exit(1)
})

start()
