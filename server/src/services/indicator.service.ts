import envConfig from '@/config'
import { OrderStatus } from '@/constants/type'
import { indicatorRepository } from '@/repositories/indicator.repository'
import { formatInTimeZone } from 'date-fns-tz'

export const indicatorService = {
  // Get dashboard indicators
  async getDashboardIndicators({ fromDate, toDate }: { fromDate: Date; toDate: Date }) {
    const [orders, guests, dishes] = await Promise.all([
      indicatorRepository.findOrdersWithDetails(fromDate, toDate),
      indicatorRepository.findGuestsWithPaidOrders(fromDate, toDate),
      indicatorRepository.findAllDishes()
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

    for (let i = fromDate; i <= toDate; i.setDate(i.getDate() + 1)) {
      revenueByDateObj[formatInTimeZone(i, envConfig.SERVER_TIMEZONE, 'dd/MM/yyyy')] = 0
    }

    // number of tables being used
    const tableNumberObj: { [key: number]: boolean } = {}
    orders.forEach((order) => {
      if (order.status === OrderStatus.Paid) {
        // revenue & dish stats by items
        order.items.forEach((item: any) => {
          revenue += item.totalPrice
          if (item.dishSnapshot.dishId && dishIndicatorObj[item.dishSnapshot.dishId]) {
            dishIndicatorObj[item.dishSnapshot.dishId].successOrders++
          }
          const date = formatInTimeZone(order.createdAt, envConfig.SERVER_TIMEZONE, 'dd/MM/yyyy')
          revenueByDateObj[date] = (revenueByDateObj[date] ?? 0) + item.totalPrice
        })
      }
      if (
        [OrderStatus.Processing, OrderStatus.Pending, OrderStatus.Delivered].includes(order.status as any) &&
        order.tableNumber !== null
      ) {
        tableNumberObj[order.tableNumber] = true
      }
    })
    // Số lượng bàn đang sử dụng
    const servingTableCount = Object.keys(tableNumberObj).length

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
