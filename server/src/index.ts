// Import the framework and instantiate it
import envConfig, { API_URL } from '@/config'
import { initOwnerAccount } from '@/controllers/account.controller'
import autoRemoveRefreshTokenJob from '@/jobs/autoRemoveRefreshToken.job'
import calendarNotificationJob from '@/jobs/calendarNotification.job'
import { errorHandlerPlugin } from '@/plugins/errorHandler.plugins'
import { mediasoupPlugin } from '@/plugins/mediasoup.plugin'
import { socketPlugin } from '@/plugins/socket.plugins'
import validatorCompilerPlugin from '@/plugins/validatorCompiler.plugins'
import accountRoutes from '@/routes/account.route'
import adminSpinRoutes from '@/routes/admin-spin.route'
import aiChatRoutes from '@/routes/ai-chat.route'
import authRoutes from '@/routes/auth.route'
import blogRoutes from '@/routes/blog.route'
import calendarTypeRoutes from '@/routes/calendar-type.route'
import calendarRoutes from '@/routes/calendar.route'
import chatRoutes from '@/routes/chat.route'
import couponRoutes from '@/routes/coupon.route'
import dishCategoryRoutes from '@/routes/dish-category.route'
import dishRoutes from '@/routes/dish.route'
import employeeSpinRoutes from '@/routes/employee-spin.route'
import fcmRoutes from '@/routes/fcm.route'
import guestRoutes from '@/routes/guest.route'
import indicatorRoutes from '@/routes/indicator.route'
import mediaRoutes from '@/routes/media.route'
import orderRoutes from '@/routes/order.route'
import paymentRoutes from '@/routes/payment.route'
import reviewRoutes from '@/routes/review.route'
import spinEventRoutes from '@/routes/spin-event.route'
import spinRewardRoutes from '@/routes/spin-reward.route'
import staticRoutes from '@/routes/static.route'
import tablesRoutes from '@/routes/table.route'
import taskAttachmentRoutes from '@/routes/task-attachment.route'
import taskCommentRoutes from '@/routes/task-comment.route'
import taskRoutes from '@/routes/task.route'
import testRoutes from '@/routes/test.route'
import { aiMemoryService } from '@/services/ai-memory.service'
import { calendarTypeService } from '@/services/calendar-type.service'
import { createFolder } from '@/utils/helpers'
import { loggerStorage } from '@/utils/logger'
import fastifyAuth from '@fastify/auth'
import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import Fastify from 'fastify'
import rawBody from 'fastify-raw-body'
import fastifySocketIO from 'fastify-socket.io'
import path from 'path'

const isDev = envConfig.NODE_ENV !== 'production'

const fastify = Fastify({
  logger: isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            colorize: true
          }
        },
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
          censor: '[REDACTED]'
        }
      }
    : {
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
          censor: '[REDACTED]'
        }
      },
  bodyLimit: 10 * 1024 * 1024 // 10MB - allows file uploads up to 10MB

  // https - reverse proxy nginx config
  // https: {
  //   key: fs.readFileSync('/etc/letsencrypt/live/164181.msk.web.highserver.ru/privkey.pem'),
  //   cert: fs.readFileSync('/etc/letsencrypt/live/164181.msk.web.highserver.ru/fullchain.pem')
  // }
})

fastify.get('/healthz', async () => ({ ok: true }))
fastify.get('/healthz1', async () => ({ ok: true }))
fastify.get('/test-glitchtip', () => {
  throw new Error('GlitchTip BE test')
})

// Run the server!
// Error handler registered inside start() below

const start = async () => {
  try {
    // Initialize Sentry first
    // initSentry()

    createFolder(path.resolve(envConfig.UPLOAD_FOLDER))
    autoRemoveRefreshTokenJob(fastify)
    calendarNotificationJob(fastify)
    // autoCheckHeartbeatJob()

    const whitelist = ['*']
    fastify.register(cors, {
      origin: whitelist,
      credentials: true
    })

    // Raw body plugin - config global nhưng chỉ bật cho route được chỉ định
    await fastify.register(rawBody, {
      field: 'rawBody',
      global: false,
      encoding: 'utf8',
      runFirst: true
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
    fastify.register(import('@fastify/rate-limit'), {
      global: false // We will apply it selectively
    })

    fastify.register(fastifySocketIO, {
      cors: {
        origin: envConfig.CLIENT_URL
      }
    })

    // Register mediasoup first so workers are available
    await fastify.register(mediasoupPlugin)
    fastify.register(socketPlugin)

    // Add Sentry request handler (captures request data)
    // if (sentryInitialized) {
    //   // Add custom error handler for Sentry
    //   fastify.setErrorHandler((error, request, reply) => {
    //     Sentry.captureException(error)
    //     // Pass to default error handler
    //     reply.send(error)
    //   })
    // }

    // Register ALS context for contextual logging
    fastify.addHook('onRequest', (request, reply, done) => {
      loggerStorage.run(request.log, done)
    })

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
    fastify.register(dishCategoryRoutes, {
      prefix: '/dish-categories'
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
    fastify.register(paymentRoutes, { prefix: '/payment' })
    fastify.register(reviewRoutes, { prefix: '/reviews' })
    fastify.register(blogRoutes, { prefix: '/blog-posts' })
    fastify.register(couponRoutes, { prefix: '/coupons' })
    fastify.register(calendarRoutes, { prefix: '/calendar' })
    fastify.register(calendarTypeRoutes, { prefix: '/calendar-types' })
    fastify.register(spinEventRoutes, { prefix: '/admin/spin-events' })
    fastify.register(spinRewardRoutes, { prefix: '/admin/spin-rewards' })
    fastify.register(employeeSpinRoutes, { prefix: '/employee-spin' })
    fastify.register(adminSpinRoutes, { prefix: '/admin/employee-spins' })
    fastify.register(taskRoutes, { prefix: '/tasks' })
    fastify.register(taskCommentRoutes, { prefix: '/tasks' })
    fastify.register(taskAttachmentRoutes, { prefix: '/tasks' })
    fastify.register(chatRoutes, { prefix: '/chat' })
    fastify.register(fcmRoutes, { prefix: '/notifications' })
    fastify.register(aiChatRoutes, { prefix: '/ai-chat' })

    // Initialize system data
    await initOwnerAccount()
    await calendarTypeService.initDefaultCalendarTypes()
    await fastify.listen({
      port: envConfig.PORT,
      // host: envConfig.DOCKER ? '0.0.0.0' : 'localhost'
      host: '0.0.0.0'
    })
    if (process.send) process.send('ready')

    fastify.log.info(`Server is ready: ${API_URL}`)
  } catch (err) {
    fastify.log.error({ err }, 'Server startup error')
    // if (sentryInitialized) {
    //   Sentry.captureException(err)
    // }
    // process.exit(1)
  }
}

async function shutdown(signal: NodeJS.Signals) {
  try {
    fastify.log.info({ signal }, 'Shutting down gracefully...')

    // Stop AI memory cleanup job
    aiMemoryService.stopCleanupJob()

    // Close Socket.IO connections
    if (fastify.io && typeof fastify.io.close === 'function') {
      fastify.io.close()
    }

    // Flush pending Sentry events before shutdown
    // if (sentryInitialized) {
    //   await Sentry.close(2000) // Wait up to 2 seconds for events to send
    // }

    await fastify.close()
    process.exit(0)
  } catch (e) {
    fastify.log.error(e)
    // if (sentryInitialized) {
    //   Sentry.captureException(e)
    // }
    process.exit(1)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('unhandledRejection', (reason) => {
  // if (sentryInitialized) {
  //   Sentry.captureException(reason)
  // }
  fastify.log.error({ reason }, 'UNHANDLED REJECTION >>>')
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  // if (sentryInitialized) {
  //   Sentry.captureException(err)
  // }
  fastify.log.error(err, 'Uncaught Exception')
  process.exit(1)
})

start()
