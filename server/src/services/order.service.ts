import { DishStatus, OrderStatus, PaymentMethod, TableStatus } from '@/constants/type'
import { createPaymentController } from '@/controllers/payment.controller'
import prisma from '@/database'
import { orderRepository } from '@/repositories/order.repository'
import { CreateOrdersBodyType, UpdateOrderBodyType } from '@/schemaValidations/order.schema'

export const orderService = {
  // Create orders
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

    // Create orders in transaction
    const [ordersRecord, socketRecord] = await Promise.all([
      prisma.$transaction(async (tx) => {
        const ordersRecord = await Promise.all(
          orders.map(async (order) => {
            // Validate dish
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

            // Create dish snapshot
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

            // Create order
            const orderRecord = await tx.order.create({
              data: {
                dishSnapshotId: dishSnapshot.id,
                guestId,
                quantity: order.quantity,
                tableNumber: guest.tableNumber,
                orderHandlerId,
                status: OrderStatus.Pending
              },
              include: {
                dishSnapshot: true,
                guest: true,
                orderHandler: true
              }
            })
            type OrderRecord = typeof orderRecord
            return orderRecord as OrderRecord & {
              status: (typeof OrderStatus)[keyof typeof OrderStatus]
              dishSnapshot: OrderRecord['dishSnapshot'] & {
                status: (typeof DishStatus)[keyof typeof DishStatus]
              }
            }
          })
        )
        return ordersRecord
      }),
      orderRepository.findSocketByGuestId(guestId)
    ])

    return {
      orders: ordersRecord,
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
    const { dishId, quantity, status, orderHandlerId } = body

    const orderRecord = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          dishSnapshot: true
        }
      })

      let dishSnapshotId = order.dishSnapshotId

      // If dish changed, create new snapshot
      if (order.dishSnapshot.dishId !== dishId) {
        const dish = await tx.dish.findUniqueOrThrow({
          where: { id: dishId }
        })
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
        dishSnapshotId = dishSnapshot.id
      }

      // Update order
      return await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          dishSnapshotId,
          quantity,
          orderHandlerId
        },
        include: {
          dishSnapshot: true,
          orderHandler: true,
          guest: true
        }
      })
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
