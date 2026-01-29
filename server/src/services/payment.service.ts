import envConfig from '@/config'
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/constants/type'
import prisma from '@/database'
import { paymentRepository } from '@/repositories/payment.repository'
import { convertUSDtoRUB, convertUSDtoVND, getLiveExchangeRate } from '@/utils/currency'
import { createStripeCheckoutSession, getStripeSession, stripe } from '@/utils/stripe'
import { buildVNPayPaymentUrl, verifyVNPayReturn } from '@/utils/vnpay'
import { createYooKassaPayment, getYooKassaPaymentStatus } from '@/utils/yookassa'
import Stripe from 'stripe'

export const paymentService = {
  // Create a payment (unified for all methods)
  async createPayment(params: {
    guestId: number
    paymentMethod: string
    note?: string | string[]
    ipAddr: string
    paymentHandlerId?: number
    currency?: string
  }) {
    const { guestId, paymentMethod, note, ipAddr, paymentHandlerId, currency } = params

    // Get unpaid orders (bills)
    const orders = await paymentRepository.findUnpaidOrdersByGuestId(guestId)

    if (orders.length === 0) {
      throw new Error('No orders need to be paid')
    }

    // Calculate total amount in USD (app's base currency)
    const totalAmountUSD = orders.reduce((sum, order) => {
      return sum + order.totalAmount
    }, 0)

    const guest = orders[0].guest
    const transactionRef = `PAY_${guestId}_${Date.now()}`

    // Description includes both USD and VND for clarity
    const description = `Payment $${totalAmountUSD.toFixed(2)} - ${orders.length} orders - ${guest?.name}`

    // Handle based on payment method
    if (paymentMethod === PaymentMethod.Cash) {
      return await this.processCashPayment({
        guestId,
        totalAmount: totalAmountUSD,
        currency,
        transactionRef,
        description,
        note,
        orders,
        paymentHandlerId,
        guest
      })
    } else if (paymentMethod === PaymentMethod.VNPay) {
      return await this.processVNPayPayment({
        guestId,
        totalAmountUSD,
        currency,
        transactionRef,
        description,
        note,
        ipAddr,
        orders,
        guest
      })
    } else if (paymentMethod === PaymentMethod.Stripe) {
      return await this.processStripePayment({
        guestId,
        totalAmountUSD,
        transactionRef,
        description,
        orders,
        guest
      })
    } else if (paymentMethod === PaymentMethod.YooKassa) {
      return await this.processYooKassaPayment({
        guestId,
        totalAmountUSD,
        transactionRef,
        description,
        orders,
        guest
      })
    }

    throw new Error(`Payment method ${paymentMethod} is not supported`)
  },

  // Process Cash Payment
  async processCashPayment(params: {
    guestId: number
    totalAmount: number
    currency?: string
    transactionRef: string
    description: string
    note?: string | string[]
    orders: any[]
    paymentHandlerId?: number
    guest: any
  }) {
    const { guestId, totalAmount, currency, transactionRef, description, note, orders, paymentHandlerId, guest } =
      params

    const exchangeRate = currency === 'USD' ? await getLiveExchangeRate() : 1
    const amountVND = currency === 'USD' ? await convertUSDtoVND(totalAmount) : totalAmount

    const result = await prisma.$transaction(async (tx) => {
      // Create payment record with USD
      const payment = await tx.payment.create({
        data: {
          guestId,
          tableNumber: guest?.tableNumber,
          amount: totalAmount,
          currency: currency,
          paymentMethod: PaymentMethod.Cash,
          status: PaymentStatus.Success,
          transactionRef,
          description,
          note: note
            ? `${note} | VND: ${amountVND.toLocaleString()} | Rate: ${exchangeRate}`
            : `VND: ${amountVND.toLocaleString()} | Rate: ${exchangeRate}`,
          metadata: JSON.stringify({
            originalAmount: totalAmount,
            originalCurrency: currency,
            convertedAmount: amountVND,
            convertedCurrency: 'VND',
            exchangeRate: exchangeRate,
            conversionDate: new Date().toISOString()
          }),
          paymentHandlerId,
          paidAt: new Date()
        }
      })

      // Update orders to Paid status and link to payment
      await tx.order.updateMany({
        where: {
          id: {
            in: orders.map((order: any) => order.id)
          }
        },
        data: {
          status: OrderStatus.Paid,
          orderHandlerId: paymentHandlerId,
          paymentId: payment.id
        }
      })

      // Get updated orders with items
      const updatedOrders = await tx.order.findMany({
        where: {
          id: {
            in: orders.map((order: any) => order.id)
          }
        },
        include: {
          items: {
            include: {
              dishSnapshot: true
            }
          },
          orderHandler: true,
          guest: true
        }
      })

      return { payment, orders: updatedOrders }
    })

    const socketRecord = await paymentRepository.findSocketByGuestId(guestId)

    return {
      payment: result.payment,
      orders: result.orders,
      socketId: socketRecord?.socketId
    }
  },

  // Process VNPay Payment
  async processVNPayPayment(params: {
    guestId: number
    totalAmountUSD: number
    currency?: string
    transactionRef: string
    description: string
    note?: string | string[]
    ipAddr: string
    orders: any[]
    guest: any
  }) {
    const { guestId, totalAmountUSD, currency, transactionRef, description, note, ipAddr, guest } = params

    const exchangeRate = await getLiveExchangeRate()
    const totalAmountVND = await convertUSDtoVND(totalAmountUSD)

    // Build VNPay payment URL with VND amount
    const paymentUrl = await buildVNPayPaymentUrl({
      amount: totalAmountVND,
      orderId: transactionRef,
      orderInfo: description,
      ipAddr,
      returnUrl: envConfig.VNPAY_RETURN_URL
    })

    // Create pending payment record with USD
    const payment = await paymentRepository.createPayment({
      guestId,
      tableNumber: guest?.tableNumber,
      amount: totalAmountUSD,
      currency: currency,
      paymentMethod: PaymentMethod.VNPay,
      status: PaymentStatus.Pending,
      transactionRef,
      paymentUrl,
      returnUrl: envConfig.VNPAY_RETURN_URL,
      ipAddress: ipAddr,
      description,
      note: note
        ? `${note} | VND: ${totalAmountVND.toLocaleString()} | Rate: ${exchangeRate}`
        : `VND: ${totalAmountVND.toLocaleString()} | Rate: ${exchangeRate}`,
      metadata: JSON.stringify({
        originalAmount: totalAmountUSD,
        originalCurrency: currency,
        convertedAmount: totalAmountVND,
        convertedCurrency: 'VND',
        exchangeRate: exchangeRate,
        conversionDate: new Date().toISOString()
      })
    })

    console.log('payment', payment)
    console.log('paymentUrl', paymentUrl)

    return {
      payment,
      paymentUrl
    }
  },

  // Process Stripe Payment
  async processStripePayment(params: {
    guestId: number
    totalAmountUSD: number
    transactionRef: string
    description: string
    orders: any[]
    guest: any
  }) {
    const { guestId, totalAmountUSD, transactionRef, description, guest } = params

    // Convert USD to cents (Stripe requires integer cents)
    const amountInCents = Math.round(totalAmountUSD * 100)

    // Create Stripe Checkout Session
    const session = await createStripeCheckoutSession({
      amount: amountInCents,
      transactionRef,
      description,
      returnUrl: envConfig.STRIPE_RETURN_URL,
      guestEmail: undefined // No email field in Guest model
    })

    // Create pending payment record
    const payment = await paymentRepository.createPayment({
      guestId,
      tableNumber: guest?.tableNumber,
      amount: totalAmountUSD, // Store in USD (original)
      currency: 'USD',
      paymentMethod: PaymentMethod.Stripe,
      status: PaymentStatus.Pending,
      transactionRef,
      externalSessionId: session.id,
      paymentUrl: session.url ?? undefined,
      returnUrl: envConfig.STRIPE_RETURN_URL,
      description,
      metadata: JSON.stringify({
        stripeSessionId: session.id,
        amountInCents,
        expiresAt: new Date(session.expires_at * 1000).toISOString()
      })
    })

    console.log('Stripe payment created:', payment.id, payment.transactionRef)
    console.log('Stripe checkout URL:', session.url)

    return {
      payment,
      paymentUrl: session.url,
      sessionId: session.id
    }
  },

  // Process YooKassa Payment
  async processYooKassaPayment(params: {
    guestId: number
    totalAmountUSD: number
    transactionRef: string
    description: string
    orders: any[]
    guest: any
  }) {
    const { guestId, totalAmountUSD, transactionRef, description, guest } = params

    const exchangeRate = await getLiveExchangeRate('RUB')
    const totalAmountRUB = await convertUSDtoRUB(totalAmountUSD)

    // Create YooKassa Payment with transaction reference in return URL
    // YooKassa does NOT automatically add query params, so we add them manually
    const returnUrlWithRef = `${envConfig.YOOKASSA_RETURN_URL}?txnRef=${transactionRef}`

    const yookassaPayment = await createYooKassaPayment({
      amount: totalAmountRUB,
      transactionRef,
      description,
      returnUrl: returnUrlWithRef,
      guestEmail: undefined // No email field in Guest model
    })

    // Create pending payment record with USD
    const payment = await paymentRepository.createPayment({
      guestId,
      tableNumber: guest?.tableNumber,
      amount: totalAmountUSD, // Store in USD (original)
      currency: 'USD',
      paymentMethod: PaymentMethod.YooKassa,
      status: PaymentStatus.Pending,
      transactionRef,
      externalTransactionId: yookassaPayment.id, // YooKassa payment ID
      paymentUrl: yookassaPayment.confirmation?.confirmation_url,
      returnUrl: returnUrlWithRef, // Use the URL with transaction reference
      description,
      metadata: JSON.stringify({
        originalAmount: totalAmountUSD,
        originalCurrency: 'USD',
        convertedAmount: totalAmountRUB,
        convertedCurrency: 'RUB',
        exchangeRate: exchangeRate,
        conversionDate: new Date().toISOString(),
        yookassaPaymentId: yookassaPayment.id,
        yookassaStatus: yookassaPayment.status
      })
    })

    console.log('YooKassa payment created:', payment.id, payment.transactionRef)
    console.log('YooKassa payment URL:', yookassaPayment.confirmation?.confirmation_url)

    return {
      payment,
      paymentUrl: yookassaPayment.confirmation?.confirmation_url,
      paymentId: yookassaPayment.id
    }
  },

  // Verify VNPay payment and update
  async verifyVNPayPayment(query: any, paymentHandlerId?: number) {
    const verifyResult = await verifyVNPayReturn(query)
    console.log('verifyResult', verifyResult)

    if (!verifyResult.isVerified) {
      throw new Error('Invalid payment signature')
    }

    const txnRef = query.vnp_TxnRef as string

    // Find payment by transaction ref
    const payment = await paymentRepository.findPaymentByTransactionRef(txnRef)

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status === PaymentStatus.Success) {
      // Already processed
      const orders = await paymentRepository.findOrdersByPaymentId(payment.id)
      return {
        payment,
        orders,
        socketId: null,
        verifyResult
      }
    }

    // Update payment based on result
    const isSuccess = verifyResult.isSuccess
    const newStatus = isSuccess ? PaymentStatus.Success : PaymentStatus.Failed

    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          externalTransactionId: query.vnp_TransactionNo,
          responseCode: query.vnp_ResponseCode,
          responseMessage: query.vnp_OrderInfo,
          bankCode: query.vnp_BankCode,
          cardType: query.vnp_CardType,
          paymentHandlerId,
          paidAt: isSuccess ? new Date() : null
        }
      })

      let updatedOrders: any[] = []

      if (isSuccess) {
        // Get orders for this guest
        const orders = await tx.order.findMany({
          where: {
            guestId: payment.guestId!,
            status: {
              in: [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered]
            }
          }
        })

        // Update orders to Paid
        await tx.order.updateMany({
          where: {
            id: {
              in: orders.map((order) => order.id)
            }
          },
          data: {
            status: OrderStatus.Paid,
            orderHandlerId: paymentHandlerId,
            paymentId: payment.id
          }
        })

        updatedOrders = await tx.order.findMany({
          where: {
            id: {
              in: orders.map((order) => order.id)
            }
          },
          include: {
            dishSnapshot: true,
            orderHandler: true,
            guest: true
          }
        })
      }

      return { payment: updatedPayment, orders: updatedOrders }
    })

    const socketRecord = await paymentRepository.findSocketByGuestId(payment.guestId!)

    return {
      payment: result.payment,
      orders: result.orders,
      socketId: socketRecord?.socketId,
      verifyResult
    }
  },

  // Verify Stripe Payment (called by webhook)
  async verifyStripePayment(event: Stripe.Event, paymentHandlerId?: number) {
    let payment: any = null
    let transactionRef: string = ''

    // Extract transaction ref based on event type
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      transactionRef = session.metadata?.transactionRef || ''
    } else if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      console.log('🔍 Looking for payment with payment_intent:', paymentIntent.id)

      // Try multiple methods to find the payment

      // Method 1: Find by externalTransactionId (if checkout.session.completed already processed)
      let existingPayment = await paymentRepository.findPaymentByExternalTransactionId(paymentIntent.id)

      if (existingPayment) {
        console.log('✅ Found payment by externalTransactionId')
        transactionRef = existingPayment.transactionRef
      } else {
        // Method 2: Get session ID from payment intent and find by externalSessionId
        console.log('⚠️ Not found by externalTransactionId, trying to get session from payment intent')

        // Stripe payment intents may have invoice or customer
        // We need to list checkout sessions to find the right one
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1
        })

        if (sessions.data.length > 0) {
          const session = sessions.data[0]
          console.log('✅ Found session:', session.id)

          // Find payment by session ID
          existingPayment = await paymentRepository.findPaymentByExternalSessionId(session.id)

          if (existingPayment) {
            console.log('✅ Found payment by externalSessionId')
            transactionRef = existingPayment.transactionRef
          }
        } else {
          console.log('⚠️ No session found for payment intent, trying recent payments')

          // Method 3: Check recent pending payments (last resort)
          const recentPayments = await paymentRepository.findRecentPendingStripePayments()

          // Try to match by fetching each session
          for (const p of recentPayments) {
            if (p.externalSessionId) {
              try {
                const session = await getStripeSession(p.externalSessionId)
                if (session.payment_intent === paymentIntent.id) {
                  console.log('✅ Found payment by matching session payment_intent')
                  transactionRef = p.transactionRef
                  break
                }
              } catch (err) {
                // Session might be expired, continue
                console.log('⚠️ Failed to get session:', p.externalSessionId)
              }
            }
          }
        }
      }
    }

    if (!transactionRef) {
      console.error('❌ Could not find transaction reference for event:', event.type, event.id)
      throw new Error('Transaction reference not found in event')
    }

    console.log('✅ Transaction reference found:', transactionRef)

    // Find payment by transaction ref
    payment = await paymentRepository.findPaymentByTransactionRef(transactionRef)

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status === PaymentStatus.Success) {
      // Already processed
      const orders = await paymentRepository.findOrdersByPaymentId(payment.id)
      return { payment, orders, socketId: null }
    }

    // Process based on event type
    const isSuccess = event.type === 'payment_intent.succeeded'
    const isFailed = event.type === 'payment_intent.payment_failed'
    const newStatus = isSuccess ? PaymentStatus.Success : isFailed ? PaymentStatus.Failed : payment.status

    // Extract payment details for successful payments
    let paymentDetails: any = {}
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Get payment method details
      let paymentMethod = null
      if (paymentIntent.payment_method) {
        try {
          paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
        } catch (err) {
          console.error('Failed to retrieve payment method:', err)
        }
      }

      paymentDetails = {
        externalTransactionId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
        last4Digits: paymentMethod?.card?.last4 || null,
        cardBrand: paymentMethod?.card?.brand || null,
        cardType: paymentMethod?.card?.funding || null // "credit" | "debit"
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      paymentDetails = {
        externalTransactionId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
        responseCode: paymentIntent.last_payment_error?.code || null,
        responseMessage: paymentIntent.last_payment_error?.message || null
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          ...paymentDetails,
          paymentHandlerId,
          paidAt: isSuccess ? new Date() : null,
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            eventType: event.type,
            eventId: event.id,
            processedAt: new Date().toISOString()
          })
        }
      })

      let updatedOrders: any[] = []

      if (isSuccess) {
        // Get orders for this guest
        const orders = await tx.order.findMany({
          where: {
            guestId: payment.guestId!,
            status: {
              in: [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered]
            }
          }
        })

        // Update orders to Paid
        await tx.order.updateMany({
          where: {
            id: { in: orders.map((order) => order.id) }
          },
          data: {
            status: OrderStatus.Paid,
            orderHandlerId: paymentHandlerId,
            paymentId: payment.id
          }
        })

        updatedOrders = await tx.order.findMany({
          where: {
            id: { in: orders.map((order) => order.id) }
          },
          include: {
            dishSnapshot: true,
            orderHandler: true,
            guest: true
          }
        })
      }

      return { payment: updatedPayment, orders: updatedOrders }
    })

    const socketRecord = await paymentRepository.findSocketByGuestId(payment.guestId!)

    return {
      payment: result.payment,
      orders: result.orders,
      socketId: socketRecord?.socketId
    }
  },

  // Verify YooKassa Payment (called by webhook)
  async verifyYooKassaPayment(notification: any, paymentHandlerId?: number) {
    const yookassaPayment = notification.object
    const transactionRef = yookassaPayment.metadata?.transactionRef

    if (!transactionRef) {
      throw new Error('Transaction reference not found in notification')
    }

    // Find payment by transaction ref
    const payment = await paymentRepository.findPaymentByTransactionRef(transactionRef)

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status === PaymentStatus.Success) {
      // Already processed
      const orders = await paymentRepository.findOrdersByPaymentId(payment.id)
      return { payment, orders, socketId: null }
    }

    // Determine payment status from notification
    const yookassaStatus = getYooKassaPaymentStatus(notification)
    const isSuccess = yookassaStatus === 'succeeded'
    const isFailed = yookassaStatus === 'canceled'
    const newStatus = isSuccess ? PaymentStatus.Success : isFailed ? PaymentStatus.Failed : PaymentStatus.Pending

    // Extract payment details
    const paymentDetails: any = {
      externalTransactionId: yookassaPayment.id,
      responseCode: yookassaPayment.status,
      responseMessage: yookassaPayment.description || null
    }

    // Add payment method details if available
    if (yookassaPayment.payment_method?.type) {
      paymentDetails.metadata = JSON.stringify({
        ...JSON.parse(payment.metadata || '{}'),
        paymentMethodType: yookassaPayment.payment_method.type,
        paymentMethodId: yookassaPayment.payment_method.id,
        eventType: notification.type,
        eventId: notification.event,
        processedAt: new Date().toISOString()
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paidAt: isSuccess ? new Date() : null,
          ...paymentDetails
        }
      })

      let updatedOrders: any[] = []

      if (isSuccess) {
        // Get orders for this guest
        const orders = await tx.order.findMany({
          where: {
            guestId: payment.guestId!,
            status: {
              in: [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered]
            }
          }
        })

        // Update orders to Paid
        await tx.order.updateMany({
          where: {
            id: {
              in: orders.map((order) => order.id)
            }
          },
          data: {
            status: OrderStatus.Paid,
            orderHandlerId: paymentHandlerId,
            paymentId: payment.id
          }
        })

        updatedOrders = await tx.order.findMany({
          where: {
            id: {
              in: orders.map((order) => order.id)
            }
          },
          include: {
            dishSnapshot: true,
            orderHandler: true,
            guest: true
          }
        })
      }

      return { payment: updatedPayment, orders: updatedOrders }
    })

    const socketRecord = await paymentRepository.findSocketByGuestId(payment.guestId!)

    return {
      payment: result.payment,
      orders: result.orders,
      socketId: socketRecord?.socketId
    }
  },

  // Get payment list (for admin/manager)
  async getPayments(filters: { fromDate?: Date; toDate?: Date; status?: string; paymentMethod?: string }) {
    return await paymentRepository.findPayments(filters)
  },

  // Get payment detail
  async getPaymentDetail(paymentId: number) {
    return await paymentRepository.findPaymentById(paymentId)
  },

  // Get guest payments
  async getGuestPayments(guestId: number) {
    return await paymentRepository.findPaymentsByGuestId(guestId)
  }
}
