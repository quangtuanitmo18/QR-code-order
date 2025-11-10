import envConfig from '@/config';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/constants/type';
import prisma from '@/database';
import { convertUSDtoVND, getLiveExchangeRate } from '@/utils/currency';
import { buildVNPayPaymentUrl, verifyVNPayReturn } from '@/utils/vnpay';

// Create a payment (unified for all methods)
export const createPaymentController = async ({
  guestId,
  paymentMethod,
  note,
  ipAddr,
  paymentHandlerId,
  currency
}: {
  guestId: number
  paymentMethod: string
  note?: string | string[]
  ipAddr: string
  paymentHandlerId?: number
  currency?: string
}) => {
  // Get unpaid orders
  const orders = await prisma.order.findMany({
    where: {
      guestId,
      status: {
        in: [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered]
      }
    },
    include: {
      dishSnapshot: true,
      guest: true
    }
  })

  if (orders.length === 0) {
    throw new Error('No orders need to be paid')
  }

  // Calculate total amount in USD (app's base currency)
  const totalAmountUSD = orders.reduce((sum, order) => {
    return sum + order.dishSnapshot.price * order.quantity
  }, 0)

  const guest = orders[0].guest
  const transactionRef = `PAY_${guestId}_${Date.now()}`
  
  // Description includes both USD and VND for clarity
 const description = `Payment $${totalAmountUSD.toFixed(2)} - ${orders.length} dishes - ${guest?.name}`

  // Handle based on payment method
  if (paymentMethod === PaymentMethod.Cash) {
    return await processCashPayment({
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
    return await processVNPayPayment({
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
  }

  throw new Error(`Payment method ${paymentMethod} is not supported`)
}

// Process Cash Payment
const processCashPayment = async ({
  guestId,
  totalAmount,
  currency,
  transactionRef,
  description,
  note,
  orders,
  paymentHandlerId,
  guest
}: any) => {
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
        note: note ? `${note} | VND: ${amountVND.toLocaleString()} | Rate: ${exchangeRate}` : `VND: ${amountVND.toLocaleString()} | Rate: ${exchangeRate}`,
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

    // Get updated orders
    const updatedOrders = await tx.order.findMany({
      where: {
        id: {
          in: orders.map((order: any) => order.id)
        }
      },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      }
    })

    return { payment, orders: updatedOrders }
  })

  const socketRecord = await prisma.socket.findUnique({
    where: { guestId }
  })

  return {
    payment: result.payment,
    orders: result.orders,
    socketId: socketRecord?.socketId
  }
}

// Process VNPay Payment
const processVNPayPayment = async ({
  guestId,
  totalAmountUSD,
  currency,
  transactionRef,
  description,
  note,
  ipAddr,
  orders,
  guest
}: any) => {
  const exchangeRate = await getLiveExchangeRate()
  const totalAmountVND = await convertUSDtoVND(totalAmountUSD)

  // Build VNPay payment URL with VND amount
  const paymentUrl = await buildVNPayPaymentUrl({
    amount: totalAmountVND, 
    orderId: transactionRef,
    orderInfo: description,
    ipAddr,
    returnUrl:  envConfig.VNPAY_RETURN_URL
  })

  // Create pending payment record with USD
  const payment = await prisma.payment.create({
    data: {
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
      note: note ? `${note} | VND: ${totalAmountVND.toLocaleString()} | Rate: ${exchangeRate}` : `VND: ${totalAmountVND.toLocaleString()} | Rate: ${exchangeRate}`,
      metadata: JSON.stringify({
        originalAmount: totalAmountUSD,
        originalCurrency: currency,
        convertedAmount: totalAmountVND,
        convertedCurrency: 'VND',
        exchangeRate: exchangeRate,
        conversionDate: new Date().toISOString()
      })
    }
  })

  console.log('payment', payment)
  console.log('paymentUrl', paymentUrl)

  return {
    payment,
    paymentUrl
  }
}

// Verify VNPay payment and update
export const verifyVNPayPaymentController = async (
  query: any,
  paymentHandlerId?: number
) => {
  const verifyResult = await verifyVNPayReturn(query)
  console.log('verifyResult', verifyResult)

  if (!verifyResult.isVerified) {
    throw new Error('Invalid payment signature')
  }

  const txnRef = query.vnp_TxnRef as string

  // Find payment by transaction ref
  const payment = await prisma.payment.findUnique({
    where: { transactionRef: txnRef },
    include: { guest: true }
  })

  if (!payment) {
    throw new Error('Payment not found')
  }

  if (payment.status === PaymentStatus.Success) {
    // Already processed
    const orders = await prisma.order.findMany({
      where: { paymentId: payment.id },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      }
    })
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

  const socketRecord = await prisma.socket.findUnique({
    where: { guestId: payment.guestId! }
  })

  return {
    payment: result.payment,
    orders: result.orders,
    socketId: socketRecord?.socketId,
    verifyResult
  }
}

// Get payment list (for admin/manager)
export const getPaymentsController = async ({
  fromDate,
  toDate,
  status,
  paymentMethod
}: {
  fromDate?: Date
  toDate?: Date
  status?: string
  paymentMethod?: string
}) => {
  return await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: fromDate,
        lte: toDate
      },
      status: status,
      paymentMethod: paymentMethod
    },
    include: {
      guest: {
        select: {
          id: true,
          name: true,
          tableNumber: true
        }
      },
      paymentHandler: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Get payment detail
export const getPaymentDetailController = async (paymentId: number) => {
  return await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      orders: {
        include: {
          dishSnapshot: true,
          orderHandler: true,
          guest: true
        }
      },
      guest: {
        select: {
          id: true,
          name: true,
          tableNumber: true
        }
      },
      paymentHandler: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true
        }
      }
    }
  })
}

// Get guest payments
export const getGuestPaymentsController = async (guestId: number) => {
  return await prisma.payment.findMany({
    where: { guestId },
    include: {
      orders: {
        include: {
          dishSnapshot: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}