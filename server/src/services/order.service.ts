import { DishStatus, OrderStatus, PaymentMethod, TableStatus } from '@/constants/type'
import { createPaymentController } from '@/controllers/payment.controller'
import prisma from '@/database'
import { orderRepository } from '@/repositories/order.repository'
import { CreateOrdersBodyType, UpdateOrderBodyType } from '@/schemaValidations/order.schema'

export const orderService = {
  // Create order (bill) with multiple items
  async createOrders(orderHandlerId: number, body: CreateOrdersBodyType) {
    const { guestId, orders } = body

    // Validate guest
    const guest = await orderRepository.findGuestById(guestId)
    if (guest.tableNumber === null) {
      throw new Error('The table associated with this customer has been deleted, please select another customer!')
    }

    // Validate table
    const table = await orderRepository.findTableByNumber(guest.tableNumber)
    if (table.status === TableStatus.Hidden) {
      throw new Error(
        `The table ${table.number} associated with this customer has been hidden, please select another customer!`
      )
    }

    // Create single order (bill) with multiple items in transaction
    const [orderRecord, socketRecord] = await Promise.all([
      prisma.$transaction(async (tx) => {
        // Validate dishes and create snapshots + items
        let totalAmount = 0

        const itemsData = []

        for (const order of orders) {
          const dish = await tx.dish.findUniqueOrThrow({
            where: {
              id: order.dishId
            }
          })
          if (dish.status === DishStatus.Unavailable) {
            throw new Error(`Dish ${dish.name} is unavailable`)
          }
          if (dish.status === DishStatus.Hidden) {
            throw new Error(`Dish ${dish.name} can not be ordered`)
          }

          const dishSnapshot = await tx.dishSnapshot.create({
            data: {
              description: dish.description,
              image: dish.image,
              name: dish.name,
              price: dish.price,
              dishId: dish.id,
              status: dish.status
            }
          })

          const unitPrice = dishSnapshot.price
          const totalPrice = unitPrice * order.quantity
          totalAmount += totalPrice

          itemsData.push({
            dishSnapshotId: dishSnapshot.id,
            quantity: order.quantity,
            unitPrice,
            totalPrice
          })
        }

        const createdOrder = await tx.order.create({
          data: {
            guestId,
            tableNumber: guest.tableNumber,
            orderHandlerId,
            status: OrderStatus.Pending,
            totalAmount,
            items: {
              create: itemsData
            }
          },
          include: {
            items: {
              include: {
                dishSnapshot: true
              }
            },
            guest: true,
            orderHandler: true
          }
        })

        return createdOrder
      }),
      orderRepository.findSocketByGuestId(guestId)
    ])

    return {
      // keep shape compatible with existing consumers that expect an array
      orders: [orderRecord],
      socketId: socketRecord?.socketId
    }
  },

  // Get orders with filters
  async getOrders(fromDate?: Date, toDate?: Date) {
    return await orderRepository.findOrders({ fromDate, toDate })
  },

  // Pay orders
  async payOrders(params: {
    guestId: number
    paymentMethod: string
    note?: string
    ipAddr: string
    paymentHandlerId?: number
    currency?: string
  }) {
    const { guestId, paymentMethod, note, ipAddr, paymentHandlerId, currency } = params

    const result = await createPaymentController({
      guestId,
      paymentMethod,
      note: note ? [note] : undefined,
      ipAddr,
      paymentHandlerId,
      currency
    })

    // For Cash payment, return orders and socketId
    if (paymentMethod === PaymentMethod.Cash) {
      if ('orders' in result && result.orders) {
        return {
          orders: result.orders,
          socketId: result.socketId
        }
      }
      throw new Error('Cash payment must return orders')
    }

    // For other payment methods, return the payment result
    return result
  },

  // Get order detail
  async getOrderDetail(orderId: number) {
    return await orderRepository.findOrderById(orderId)
  },

  // Update order
  async updateOrder(orderId: number, body: UpdateOrderBodyType & { orderHandlerId: number }) {
    const { status, orderHandlerId } = body

    const orderRecord = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        orderHandlerId
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

    const socketRecord = await prisma.socket.findUnique({
      where: {
        guestId: orderRecord.guestId!
      }
    })

    return {
      order: orderRecord,
      socketId: socketRecord?.socketId
    }
  }
}
