import { OrderStatus } from '@/constants/type'
import prisma from '@/database'

export const indicatorRepository = {
  // Get orders with filters and includes
  async findOrdersWithDetails(fromDate: Date, toDate: Date) {
    return await prisma.order.findMany({
      include: {
        items: {
          include: {
            dishSnapshot: true
          }
        },
        table: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      }
    })
  },

  // Get guests who have paid orders in date range
  async findGuestsWithPaidOrders(fromDate: Date, toDate: Date) {
    return await prisma.guest.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        orders: {
          some: {
            status: OrderStatus.Paid
          }
        }
      }
    })
  },

  // Get all dishes
  async findAllDishes() {
    return await prisma.dish.findMany()
  }
}
