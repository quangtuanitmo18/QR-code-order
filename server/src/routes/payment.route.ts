import { ManagerRoom } from '@/constants/type'
import {
  getGuestPaymentsController,
  getPaymentDetailController,
  getPaymentsController,
  verifyStripePaymentController,
  verifyVNPayPaymentController,
  verifyYooKassaPaymentController
} from '@/controllers/payment.controller'
import prisma from '@/database'
import { requireEmployeeHook, requireGuestHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
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
import { getStripeSession, verifyStripeWebhook } from '@/utils/stripe'
import { getYooKassaPayment, verifyYooKassaWebhook } from '@/utils/yookassa'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function paymentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
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

  // Stripe return URL (public, no auth)
  fastify.get('/stripe/return', async (request, reply) => {
    try {
      const { session_id, success } = request.query as { session_id?: string; success?: string }

      if (!session_id) {
        throw new Error('Session ID is required')
      }

      // Fetch session from Stripe
      const session = await getStripeSession(session_id)
      const transactionRef = session.metadata?.transactionRef

      if (!transactionRef) {
        throw new Error('Transaction reference not found')
      }

      // Find payment in database
      const payment = await prisma.payment.findUnique({
        where: { transactionRef }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const paymentSuccess = success === 'true' && session.payment_status === 'paid'

      const redirectUrl = `${clientUrl}/en/guest/orders/payment-result?success=${paymentSuccess}&amount=${payment.amount}&txnRef=${transactionRef}&method=Stripe`

      console.log('Stripe return: Redirecting to', redirectUrl)
      reply.redirect(redirectUrl)
    } catch (error: any) {
      console.error('Stripe return error:', error)
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const redirectUrl = `${clientUrl}/en/guest/orders/payment-result?success=false&error=${encodeURIComponent(error.message)}`
      reply.redirect(redirectUrl)
    }
  })

  // Stripe Webhook (IPN)
  fastify.post(
    '/stripe/webhook',
    {
      config: {
        rawBody: true // Required for signature verification
      }
    },
    async (request, reply) => {
      try {
        const signature = request.headers['stripe-signature'] as string

        if (!signature) {
          reply.status(400).send({ error: 'No signature provided' })
          return
        }

        // Get raw body for signature verification
        const rawBody = (request as any).rawBody || request.body

        // Verify webhook signature
        const event = verifyStripeWebhook(rawBody, signature)

        console.log('Stripe webhook event:', event.type, event.id)

        // Handle relevant events
        if (
          event.type === 'checkout.session.completed' ||
          event.type === 'payment_intent.succeeded' ||
          event.type === 'payment_intent.payment_failed'
        ) {
          const result = await verifyStripePaymentController(event)

          // Emit real-time update (Socket.io)
          if (result.orders.length > 0) {
            if (result.socketId) {
              fastify.io.to(result.socketId).to(ManagerRoom).emit('payment', result.orders)
            } else {
              fastify.io.to(ManagerRoom).emit('payment', result.orders)
            }
            console.log('Stripe payment processed: Emitted to Socket.io')
          }
        }

        reply.send({ received: true })
      } catch (error: any) {
        console.error('Stripe webhook error:', error)
        reply.status(400).send({ error: error.message })
      }
    }
  )

  // YooKassa return URL (public, no auth)
  // Note: YooKassa does NOT automatically add query params to return_url
  // We add the transaction reference when creating the payment
  fastify.get('/yookassa/return', async (request, reply) => {
    try {
      const { txnRef } = request.query as { txnRef?: string }

      console.log('YooKassa return: Query params:', JSON.stringify(request.query, null, 2))

      if (!txnRef) {
        throw new Error('Transaction reference is required')
      }

      // Find payment in database
      const payment = await prisma.payment.findUnique({
        where: { transactionRef: txnRef }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      // Fetch latest payment status from YooKassa
      const yookassaPayment = await getYooKassaPayment(payment.externalTransactionId!)

      console.log('YooKassa return: Payment status from API:', yookassaPayment.status)

      // Update payment status if needed (webhook may not have been processed yet)
      if (yookassaPayment.status === 'succeeded' && payment.status === 'Pending') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'Success',
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata as string),
              yookassaStatus: yookassaPayment.status,
              updatedAt: new Date().toISOString()
            })
          }
        })
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const paymentSuccess = yookassaPayment.status === 'succeeded'

      const redirectUrl = `${clientUrl}/en/guest/orders/payment-result?success=${paymentSuccess}&amount=${payment.amount}&txnRef=${txnRef}&method=YooKassa`

      console.log('YooKassa return: Redirecting to', redirectUrl)
      reply.redirect(redirectUrl)
    } catch (error: any) {
      console.error('YooKassa return error:', error)
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const redirectUrl = `${clientUrl}/en/guest/orders/payment-result?success=false&error=${encodeURIComponent(error.message)}`
      reply.redirect(redirectUrl)
    }
  })

  // YooKassa Webhook (Notification)
  fastify.post('/yookassa/webhook', async (request, reply) => {
    try {
      const authHeader = request.headers['authorization'] as string

      if (!authHeader) {
        reply.status(400).send({ error: 'No authorization header provided' })
        return
      }

      // Verify webhook with Basic Auth
      const notification = verifyYooKassaWebhook(authHeader, request.body)

      console.log('YooKassa webhook notification:', notification.type, notification.event)

      // Handle payment events
      if (
        notification.type === 'notification' &&
        (notification.event === 'payment.succeeded' ||
          notification.event === 'payment.waiting_for_capture' ||
          notification.event === 'payment.canceled')
      ) {
        const result = await verifyYooKassaPaymentController(notification)

        // Emit real-time update (Socket.io)
        if (result.orders.length > 0) {
          if (result.socketId) {
            fastify.io.to(result.socketId).to(ManagerRoom).emit('payment', result.orders)
          } else {
            fastify.io.to(ManagerRoom).emit('payment', result.orders)
          }
          console.log('YooKassa payment processed: Emitted to Socket.io')
        }
      }

      reply.status(200).send()
    } catch (error: any) {
      console.error('YooKassa webhook error:', error)
      reply.status(400).send({ error: error.message })
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
      preValidation: fastify.auth([requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], { relation: 'and' })
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
