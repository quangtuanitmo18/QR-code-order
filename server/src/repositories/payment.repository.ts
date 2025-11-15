import prisma from '@/database'
import { OrderStatus } from '@/constants/type'

export const paymentRepository = {
  // Find unpaid orders by guestId
  async findUnpaidOrdersByGuestId(guestId: number) {
    return await prisma.order.findMany({
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
  },

  // Create payment
  async createPayment(data: {
    guestId: number
    tableNumber: number | null
    amount: number
    currency?: string
    paymentMethod: string
    status: string
    transactionRef: string
    description: string
    note?: string
    metadata?: string
    paymentHandlerId?: number
    paidAt?: Date
    paymentUrl?: string
    returnUrl?: string
    ipAddress?: string
    externalSessionId?: string
    externalTransactionId?: string
    responseCode?: string
    responseMessage?: string
    bankCode?: string
    cardType?: string
  }) {
    return await prisma.payment.create({ data })
  },

  // Find payment by transaction reference
  async findPaymentByTransactionRef(transactionRef: string) {
    return await prisma.payment.findUnique({
      where: { transactionRef },
      include: { guest: true }
    })
  },

  // Find payment by external session ID
  async findPaymentByExternalSessionId(externalSessionId: string) {
    return await prisma.payment.findFirst({
      where: { externalSessionId }
    })
  },

  // Find payment by external transaction ID
  async findPaymentByExternalTransactionId(externalTransactionId: string) {
    return await prisma.payment.findFirst({
      where: { externalTransactionId }
    })
  },

  // Find recent pending Stripe payments
  async findRecentPendingStripePayments() {
    return await prisma.payment.findMany({
      where: {
        paymentMethod: 'Stripe',
        status: 'Pending',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  // Update payment
  async updatePayment(paymentId: number, data: any) {
    return await prisma.payment.update({
      where: { id: paymentId },
      data
    })
  },

  // Update many orders
  async updateOrdersStatus(orderIds: number[], data: { status: string; orderHandlerId?: number; paymentId: number }) {
    return await prisma.order.updateMany({
      where: {
        id: { in: orderIds }
      },
      data
    })
  },

  // Find orders by IDs
  async findOrdersByIds(orderIds: number[]) {
    return await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      }
    })
  },

  // Find orders by payment ID
  async findOrdersByPaymentId(paymentId: number) {
    return await prisma.order.findMany({
      where: { paymentId },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      }
    })
  },

  // Find socket by guestId
  async findSocketByGuestId(guestId: number) {
    return await prisma.socket.findUnique({
      where: { guestId }
    })
  },

  // Get payments with filters
  async findPayments(filters: { fromDate?: Date; toDate?: Date; status?: string; paymentMethod?: string }) {
    return await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: filters.fromDate,
          lte: filters.toDate
        },
        status: filters.status,
        paymentMethod: filters.paymentMethod
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
  },

  // Find payment by ID
  async findPaymentById(paymentId: number) {
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
  },

  // Find guest payments
  async findPaymentsByGuestId(guestId: number) {
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
}
