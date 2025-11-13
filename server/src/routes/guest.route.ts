import { ManagerRoom, Role } from '@/constants/type'
import {
  guestCreateOrdersController,
  guestGetOrdersController,
  guestLoginController,
  guestLogoutController,
  guestRefreshTokenController
} from '@/controllers/guest.controller'
import { createPaymentController } from '@/controllers/payment.controller'
import { requireGuestHook, requireLoginedHook } from '@/hooks/auth.hooks'
import {
  LogoutBody,
  LogoutBodyType,
  RefreshTokenBody,
  RefreshTokenBodyType,
  RefreshTokenRes,
  RefreshTokenResType
} from '@/schemaValidations/auth.schema'
import { MessageRes, MessageResType } from '@/schemaValidations/common.schema'
import {
  GuestCreateOrdersBody,
  GuestCreateOrdersBodyType,
  GuestCreateOrdersRes,
  GuestCreateOrdersResType,
  GuestGetOrdersRes,
  GuestGetOrdersResType,
  GuestLoginBody,
  GuestLoginBodyType,
  GuestLoginRes,
  GuestLoginResType
} from '@/schemaValidations/guest.schema'
import {
  CreatePaymentBody,
  CreatePaymentBodyType,
  CreatePaymentRes,
  CreatePaymentResType
} from '@/schemaValidations/payment.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function guestRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post<{ Reply: GuestLoginResType; Body: GuestLoginBodyType }>(
    '/auth/login',
    {
      schema: {
        response: {
          200: GuestLoginRes
        },
        body: GuestLoginBody
      }
    },
    async (request, reply) => {
      const { body } = request
      const result = await guestLoginController(body)
      reply.send({
        message: 'Login successful!',
        data: {
          guest: {
            id: result.guest.id,
            name: result.guest.name,
            role: Role.Guest,
            tableNumber: result.guest.tableNumber,
            createdAt: result.guest.createdAt,
            updatedAt: result.guest.updatedAt
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      })
    }
  )
  fastify.post<{ Reply: MessageResType; Body: LogoutBodyType }>(
    '/auth/logout',
    {
      schema: {
        response: {
          200: MessageRes
        },
        body: LogoutBody
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const message = await guestLogoutController(request.decodedAccessToken?.userId as number)
      reply.send({
        message
      })
    }
  )

  fastify.post<{
    Reply: RefreshTokenResType
    Body: RefreshTokenBodyType
  }>(
    '/auth/refresh-token',
    {
      schema: {
        response: {
          200: RefreshTokenRes
        },
        body: RefreshTokenBody
      }
    },
    async (request, reply) => {
      const result = await guestRefreshTokenController(request.body.refreshToken)
      reply.send({
        message: 'Refresh token successfully!',
        data: result
      })
    }
  )

  fastify.post<{
    Reply: GuestCreateOrdersResType
    Body: GuestCreateOrdersBodyType
  }>(
    '/orders',
    {
      schema: {
        response: {
          200: GuestCreateOrdersRes
        },
        body: GuestCreateOrdersBody
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const guestId = request.decodedAccessToken?.userId as number
      const result = await guestCreateOrdersController(guestId, request.body)
      fastify.io.to(ManagerRoom).emit('new-order', result)
      reply.send({
        message: 'Order created successfully!',
        data: result as GuestCreateOrdersResType['data']
      })
    }
  )

  fastify.get<{
    Reply: GuestGetOrdersResType
  }>(
    '/orders',
    {
      schema: {
        response: {
          200: GuestGetOrdersRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const guestId = request.decodedAccessToken?.userId as number
      const result = await guestGetOrdersController(guestId)
      reply.send({
        message: 'Get the list of orders successfully!',
        data: result as GuestGetOrdersResType['data']
      })
    }
  )
  fastify.post<{
    Reply: CreatePaymentResType
    Body: CreatePaymentBodyType
  }>(
    '/orders/create-payment',
    {
      schema: {
        response: {
          200: CreatePaymentRes
        },
        body: CreatePaymentBody
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const guestId = request.decodedAccessToken?.userId as number
      const ipAddr = request.ip || '127.0.0.1'

      const result = await createPaymentController({
        guestId,
        paymentMethod: request.body.paymentMethod,
        note: request.body.note,
        currency: request.body.currency as 'USD' | 'VND' | undefined,
        ipAddr
      })

      reply.send({
        message: 'Payment created successfully',
        data: result as CreatePaymentResType['data']
      })
    }
  )
}
