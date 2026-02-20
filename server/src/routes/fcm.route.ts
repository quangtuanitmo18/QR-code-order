import { fcmController } from '@/controllers/fcm.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import { RegisterFcmTokenBody, RegisterFcmTokenBodyType, UnregisterFcmTokenBody, UnregisterFcmTokenBodyType } from '@/schemaValidations/fcm.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function fcmRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook]))

  fastify.post<{ Body: RegisterFcmTokenBodyType }>(
    '/register-token',
    {
      schema: {
        body: RegisterFcmTokenBody
      }
    },
    fcmController.registerToken
  )

  fastify.delete<{ Body: UnregisterFcmTokenBodyType }>(
    '/unregister-token',
    {
      schema: {
        body: UnregisterFcmTokenBody
      }
    },
    fcmController.unregisterToken
  )
}
