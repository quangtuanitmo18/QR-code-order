/**
 * Test helper — builds a minimal Fastify app for integration testing.
 *
 * Usage:
 *   const app = await buildTestApp()
 *   const response = await app.inject({ method: 'POST', url: '/auth/login', ... })
 */
import { errorHandlerPlugin } from '@/plugins/errorHandler.plugins'
import validatorCompilerPlugin from '@/plugins/validatorCompiler.plugins'
import accountRoutes from '@/routes/account.route'
import authRoutes from '@/routes/auth.route'
import dishRoutes from '@/routes/dish.route'
import guestRoutes from '@/routes/guest.route'
import orderRoutes from '@/routes/order.route'
import tablesRoutes from '@/routes/table.route'
import fastifyAuth from '@fastify/auth'
import fastifyCookie from '@fastify/cookie'
import Fastify, { FastifyInstance } from 'fastify'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false
  })

  // Mock socket.io (used by guest/order routes for real-time events)
  const mockEmit = () => mockIo
  const mockIo = { to: () => mockIo, emit: mockEmit }
  app.decorate('io', mockIo as any)

  // Core plugins
  app.register(errorHandlerPlugin)
  app.register(fastifyAuth, { defaultRelation: 'and' })
  app.register(fastifyCookie)
  app.register(validatorCompilerPlugin)

  // Routes under test
  app.register(authRoutes, { prefix: '/auth' })
  app.register(tablesRoutes, { prefix: '/tables' })
  app.register(dishRoutes, { prefix: '/dishes' })
  app.register(guestRoutes, { prefix: '/guest' })
  app.register(orderRoutes, { prefix: '/orders' })
  app.register(accountRoutes, { prefix: '/accounts' })

  await app.ready()
  return app
}
