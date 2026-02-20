import prisma from '@/database'
import { RegisterFcmTokenBodyType, UnregisterFcmTokenBodyType } from '@/schemaValidations/fcm.schema'
import { FastifyReply, FastifyRequest } from 'fastify'

export const fcmController = {
  /**
   * Register a new FCM Token for the authenticated user
   */
  async registerToken(req: FastifyRequest<{ Body: RegisterFcmTokenBodyType }>, reply: FastifyReply) {
    try {
      const accountId = req.decodedAccessToken?.userId || (req as any).user?.id || (req as any).account?.id
      if (!accountId) {
         return reply.status(401).send({ message: 'Unauthorized: No accountId found' })
      }
      
      const { token, deviceType } = req.body

      if (!token) {
        return reply.status(400).send({
          status: 400,
          message: 'FCM Token is required',
          payload: { data: null }
        })
      }

      // Upsert the token to ensure we don't have duplicates, but keep it linked to the account
      const fcmToken = await prisma.fcmToken.upsert({
        where: { token },
        update: {
          accountId, // Re-assign if token was somehow transferred
          deviceType,
          updatedAt: new Date()
        },
        create: {
          accountId,
          token,
          deviceType
        }
      })

      return reply.status(200).send({
        status: 200,
        message: 'FCM Token registered successfully',
        payload: { data: fcmToken }
      })
    } catch (error) {
      console.error('[FcmController.registerToken] Error:', error)
      return reply.status(500).send({
        status: 500,
        message: 'Internal server error',
        payload: { error: String(error), stack: (error as any)?.stack }
      })
    }
  },

  /**
   * Unregister an FCM Token (e.g., on logout)
   */
  async unregisterToken(req: FastifyRequest<{ Body: UnregisterFcmTokenBodyType }>, reply: FastifyReply) {
    try {
      const accountId = req.decodedAccessToken?.userId || (req as any).user?.id || (req as any).account?.id
      if (!accountId) {
         return reply.status(401).send({ message: 'Unauthorized: No accountId found' })
      }
      const { token } = req.body

      if (!token) {
        return reply.status(400).send({
          status: 400,
          message: 'FCM Token is required',
          payload: { data: null }
        })
      }

      await prisma.fcmToken.deleteMany({
        where: {
          accountId,
          token
        }
      })

      return reply.status(200).send({
        status: 200,
        message: 'FCM Token unregistered successfully',
        payload: { data: null }
      })
    } catch (error) {
      console.error('[FcmController.unregisterToken] Error:', error)
      return reply.status(500).send({
        status: 500,
        message: 'Internal server error',
        payload: { error: String(error), stack: (error as any)?.stack }
      })
    }
  }
}
