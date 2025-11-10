import { ManagerRoom } from '@/constants/type'
import {
  getGuestPaymentsController,
  getPaymentDetailController,
  getPaymentsController,
  verifyVNPayPaymentController
} from '@/controllers/payment.controller'
import {
  requireEmployeeHook,
  requireGuestHook,
  requireLoginedHook,
  requireOwnerHook
} from '@/hooks/auth.hooks'
import {
  GetPaymentDetailRes,
  GetPaymentDetailResType,
  GetPaymentsQueryParams,
  GetPaymentsQueryParamsType,
  GetPaymentsRes,
  GetPaymentsResType,
  PaymentParam,
  PaymentParamType
} from '@/schemaValidations/payment.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function paymentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // VNPay return URL (public, no auth)
  fastify.get('/vnpay/return', async (request, reply) => {
    try {
      const result = await verifyVNPayPaymentController(request.query)

      if (result.socketId) {
        fastify.io.to(result.socketId).to(ManagerRoom).emit('payment', result.orders)
      } else {
        fastify.io.to(ManagerRoom).emit('payment', result.orders)
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const success = result.payment.status === 'Success'


      const redirectUrl = `${clientUrl}/en/guest/orders/payment-result?success=${success}&amount=${result.payment.amount}&txnRef=${result.payment.transactionRef}&method=${result.payment.paymentMethod}`

      reply.redirect(redirectUrl)
    } catch (error: any) {
      console.log('error', error)
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const redirectUrl = `${clientUrl}/guest/orders/payment-result?success=false&error=${encodeURIComponent(error.message)}`
      reply.redirect(redirectUrl)
    }
  })

  // VNPay IPN (webhook)
  fastify.post('/vnpay/ipn', async (request, reply) => {
    try {
      await verifyVNPayPaymentController(request.body)
      reply.send({ RspCode: '00', Message: 'Confirm Success' })
    } catch (error) {
      reply.status(400).send({ RspCode: '97', Message: 'Invalid Signature' })
    }
  })

  // Get payment list (for admin/manager)
  fastify.get<{
    Reply: GetPaymentsResType
    Querystring: GetPaymentsQueryParamsType
  }>(
    '/',
    {
      schema: {
        response: {
          200: GetPaymentsRes
        },
        querystring: GetPaymentsQueryParams
      },
      preValidation: fastify.auth(
        [requireLoginedHook, [requireOwnerHook, requireEmployeeHook]],
        { relation: 'and' }
      )
    },
    async (request, reply) => {
      const payments = await getPaymentsController({
        fromDate: request.query.fromDate,
        toDate: request.query.toDate,
        status: request.query.status,
        paymentMethod: request.query.paymentMethod
      })
      reply.send({
        message: 'Get payments successfully',
        data: payments as GetPaymentsResType['data']
      })
    }
  )

  // Get payment detail
  fastify.get<{
    Reply: GetPaymentDetailResType
    Params: PaymentParamType
  }>(
    '/:paymentId',
    {
      schema: {
        response: {
          200: GetPaymentDetailRes
        },
        params: PaymentParam
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const payment = await getPaymentDetailController(request.params.paymentId)
      reply.send({
        message: 'Get payment detail successfully',
        data: payment as GetPaymentDetailResType['data']
      })
    }
  )

  // Get guest payments (for guest to view their payment history)
  fastify.get(
    '/guest/my-payments',
    {
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const guestId = request.decodedAccessToken?.userId as number
      const payments = await getGuestPaymentsController(guestId)
      reply.send({
        message: 'Get guest payments successfully',
        data: payments
      })
    }
  )
}