// Import the framework and instantiate it
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
import fs from 'fs'
import path from 'path'

const fastify = Fastify({
  logger: true,
  http2: true,
  https: {
    key: fs.readFileSync('/etc/letsencrypt/live/164181.msk.web.highserver.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/164181.msk.web.highserver.ru/fullchain.pem')
  },
  trustProxy: true
})

// Run the server!
const start = async () => {
  try {
    createFolder(path.resolve(envConfig.UPLOAD_FOLDER))
    autoRemoveRefreshTokenJob()
    const whitelist = ['*']
    fastify.register(cors, {
      origin: whitelist, // Cho phép tất cả các domain gọi API
      credentials: true // Cho phép trình duyệt gửi cookie đến server
    })

    fastify.register(fastifyAuth, {
      defaultRelation: 'and'
    })
    fastify.register(fastifyHelmet, {
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      }
    })
    fastify.register(fastifyCookie)
    fastify.register(validatorCompilerPlugin)
    fastify.register(errorHandlerPlugin)
    fastify.register(fastifySocketIO, {
      cors: {
        origin: envConfig.CLIENT_URL
      }
    })
    fastify.register(socketPlugin)
    fastify.register(authRoutes, {
      prefix: '/auth'
    })
    fastify.register(accountRoutes, {
      prefix: '/accounts'
    })
    fastify.register(mediaRoutes, {
      prefix: '/media'
    })
    fastify.register(staticRoutes, {
      prefix: '/static'
    })
    fastify.register(dishRoutes, {
      prefix: '/dishes'
    })
    fastify.register(tablesRoutes, {
      prefix: '/tables'
    })
    fastify.register(orderRoutes, {
      prefix: '/orders'
    })
    fastify.register(testRoutes, {
      prefix: '/test'
    })
    fastify.register(guestRoutes, {
      prefix: '/guest'
    })
    fastify.register(indicatorRoutes, {
      prefix: '/indicators'
    })
    await initOwnerAccount()
    await fastify.listen({
      port: envConfig.PORT,
      // host: envConfig.DOCKER ? '0.0.0.0' : 'localhost'
      host: '0.0.0.0'
    })
    console.log(`Server đang chạy: ${API_URL}`)
  } catch (err) {
    console.log(err)
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
