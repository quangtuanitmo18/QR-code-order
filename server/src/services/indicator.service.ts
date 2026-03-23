import envConfig from '@/config'
import { OrderStatus, TableStatus } from '@/constants/type'
import prisma from '@/database'
import { indicatorRepository } from '@/repositories/indicator.repository'
import { formatInTimeZone } from 'date-fns-tz'

export const indicatorService = {
  // Get dashboard indicators
  async getDashboardIndicators({ fromDate, toDate }: { fromDate: Date; toDate: Date }) {
    const [orders, guests, dishes, servingTableCount] = await Promise.all([
      indicatorRepository.findOrdersWithDetails(fromDate, toDate),
      indicatorRepository.findGuestsWithPaidOrders(fromDate, toDate),
      indicatorRepository.findAllDishes(),
      prisma.table.count({ where: { status: TableStatus.Reserved } })
    ])

    // revenue
    let revenue = 0
    // number of customers who ordered dish successfully
    const guestCount = guests.length
    // Số lượng đơn (bill)
    const orderCount = orders.length
    // statistics of dishes
    const dishIndicatorObj: Record<
      number,
      {
        id: number
        name: string
        price: number
        description: string
        image: string
        status: string
        createdAt: Date
        updatedAt: Date
        successOrders: number // Số lượng đã đặt thành công
      }
    > = dishes.reduce((acc, dish) => {
      acc[dish.id] = { ...dish, successOrders: 0 }
      return acc
    }, {} as any)
    // revenue by date
    // Tạo object revenueByDateObj với key là ngày từ fromDate -> toDate và value là doanh thu
    const revenueByDateObj: { [key: string]: number } = {}

    const iDate = new Date(fromDate)
    while (iDate <= toDate) {
      revenueByDateObj[formatInTimeZone(iDate, envConfig.SERVER_TIMEZONE, 'dd/MM/yyyy')] = 0
      iDate.setDate(iDate.getDate() + 1)
    }

    // number of tables being used
    const tableNumberObj: { [key: number]: boolean } = {}
    orders.forEach((order) => {
      if (order.status === OrderStatus.Paid) {
        const netRevenue = order.totalAmount - (order.discountAmount ?? 0)
        revenue += netRevenue
        const date = formatInTimeZone(order.createdAt, envConfig.SERVER_TIMEZONE, 'dd/MM/yyyy')
        revenueByDateObj[date] = (revenueByDateObj[date] ?? 0) + netRevenue

        // dish stats by items
        order.items.forEach((item: any) => {
          if (item.dishSnapshot.dishId && dishIndicatorObj[item.dishSnapshot.dishId]) {
            dishIndicatorObj[item.dishSnapshot.dishId].successOrders += item.quantity
          }
        })
      }
    })

    const revenueByDate = Object.keys(revenueByDateObj).map((date) => {
      return {
        date,
        revenue: revenueByDateObj[date]
      }
    })
    const dishIndicator = Object.values(dishIndicatorObj)
    return {
      revenue,
      guestCount,
      orderCount,
      servingTableCount,
      dishIndicator,
      revenueByDate
    }
  }
}
