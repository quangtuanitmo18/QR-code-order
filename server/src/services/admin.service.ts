import { DishStatus, OrderStatus, PaymentStatus, TableStatus } from '@/constants/type'
import prisma from '@/database'
import { getContextLogger } from '@/utils/logger'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RevenueTrendsResult {
  totalRevenue: number
  paymentCount: number
  dailyBreakdown: Array<{ date: string; revenue: number; orderCount: number }>
  message: string
}

export interface DishPerformanceItem {
  name: string
  totalOrdered: number
  price: number
}

export interface LiveOrderItem {
  name: string
  quantity: number
  unitPrice: number
}

export interface LiveOrderDetail {
  id: number
  table: number | undefined
  guestName: string | undefined
  status: string
  amount: number
  items: LiveOrderItem[]
  time: Date
}

export interface LiveOrdersResult {
  pendingOrderCount: number
  activeTables: number
  pendingOrders: LiveOrderDetail[]
}

export interface DishUpdateResult {
  message: string
  dish?: any
}

export interface OrderCancelResult {
  message: string
  order?: any
}

export interface SearchOrderItem {
  name: string
  quantity: number
  unitPrice: number
}

export interface SearchOrderResult {
  id: number
  guestName: string | null
  tableNumber: number | null
  status: string
  totalAmount: number
  items: SearchOrderItem[]
  createdAt: Date
}

// ─── Service ─────────────────────────────────────────────────────────────────

class AdminService {
  /**
   * Get revenue trends for a date range.
   */
  async getRevenueTrends(startDate: string, endDate: string): Promise<RevenueTrendsResult> {
    const log = getContextLogger()

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        totalRevenue: 0,
        paymentCount: 0,
        dailyBreakdown: [],
        message: 'Invalid date format. Please use ISO 8601 (e.g., 2026-03-01T00:00:00Z).'
      }
    }

    // Chặn chống sập RAM máy chủ: Yêu cầu lấy dữ liệu giới hạn trong 1 năm
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 365) {
      return {
        totalRevenue: 0,
        paymentCount: 0,
        dailyBreakdown: [],
        message: 'Khoảng thời gian vượt quá 365 ngày. Vì lý do an toàn hiệu năng, vui lòng truy vấn từng năm một.'
      }
    }

    try {
      const payments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.Success,
          paidAt: { gte: start, lte: end }
        },
        select: { amount: true, paidAt: true }
      })

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

      // Build daily breakdown
      const dailyMap = new Map<string, { revenue: number; orderCount: number }>()
      for (const p of payments) {
        if (!p.paidAt) continue
        const day = p.paidAt.toISOString().slice(0, 10) // YYYY-MM-DD
        const entry = dailyMap.get(day) || { revenue: 0, orderCount: 0 }
        entry.revenue += p.amount
        entry.orderCount += 1
        dailyMap.set(day, entry)
      }
      const dailyBreakdown = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }))

      return {
        totalRevenue,
        paymentCount: payments.length,
        dailyBreakdown,
        message: `Total revenue from ${startDate} to ${endDate} is $${totalRevenue / 100} across ${payments.length} paid orders.`
      }
    } catch (error) {
      log?.error({ err: error }, '[AdminService] getRevenueTrends DB error')
      throw error
    }
  }

  /**
   * Get best or worst performing dishes by order volume.
   */
  async getDishPerformance(sortBy: 'best' | 'worst', limit: number): Promise<DishPerformanceItem[]> {
    const popularItems = await prisma.orderItem.groupBy({
      by: ['dishSnapshotId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: sortBy === 'best' ? 'desc' : 'asc' } },
      take: limit
    })

    const snapshotIds = popularItems.map((item) => item.dishSnapshotId)
    const snapshots = await prisma.dishSnapshot.findMany({
      where: { id: { in: snapshotIds } }
    })

    const snapshotMap = new Map(snapshots.map((s) => [s.id, s]))

    return popularItems.map((item) => {
      const snap = snapshotMap.get(item.dishSnapshotId)
      return {
        name: snap?.name || 'Unknown',
        totalOrdered: item._sum.quantity || 0,
        price: snap?.price || 0
      }
    })
  }

  /**
   * Update a dish's status or price. Only whitelisted fields are applied.
   */
  async updateDish(dishId: number, updates: { status?: string; price?: number }): Promise<DishUpdateResult> {
    const validStatuses = [DishStatus.Available, DishStatus.Unavailable, DishStatus.Hidden] as string[]
    if (updates.status && !validStatuses.includes(updates.status)) {
      return { message: `Invalid status "${updates.status}". Valid: ${validStatuses.join(', ')}` }
    }

    try {
      const dish = await prisma.dish.update({
        where: { id: dishId },
        data: {
          ...(updates.status ? { status: updates.status } : {}),
          ...(updates.price !== undefined ? { price: updates.price } : {})
        }
      })

      return {
        message: `Successfully updated dish #${dishId} (${dish.name}).`,
        dish
      }
    } catch (error) {
      return { message: `Failed to update dish #${dishId}. It might not exist.` }
    }
  }

  /**
   * Force-cancel an order by setting its status to Rejected.
   */
  async cancelOrder(orderId: number, reason: string): Promise<OrderCancelResult> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.Rejected },
        include: {
          guest: { select: { name: true } },
          table: { select: { number: true } },
          items: {
            include: { dishSnapshot: { select: { name: true } } }
          }
        }
      })

      return {
        message: `Order #${orderId} has been forcefully cancelled. Reason: ${reason}`,
        order: {
          id: order.id,
          guestName: order.guest?.name,
          tableNumber: order.table?.number,
          totalAmount: order.totalAmount,
          items: order.items.map((item) => ({
            name: item.dishSnapshot.name,
            quantity: item.quantity
          }))
        }
      }
    } catch (error) {
      return { message: `Failed to cancel order #${orderId}. It might not exist.` }
    }
  }

  /**
   * Get live restaurant status: pending orders + occupied tables.
   */
  async getLiveOrders(): Promise<LiveOrdersResult> {
    const pendingOrders = await prisma.order.findMany({
      where: { status: { in: [OrderStatus.Pending, OrderStatus.Processing] } },
      include: {
        table: { select: { number: true } },
        guest: { select: { name: true } },
        items: {
          include: { dishSnapshot: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const activeTables = await prisma.table.count({
      where: { status: TableStatus.Reserved }
    })

    return {
      pendingOrderCount: pendingOrders.length,
      activeTables,
      pendingOrders: pendingOrders.map((o) => ({
        id: o.id,
        table: o.table?.number,
        guestName: o.guest?.name,
        status: o.status,
        amount: o.totalAmount,
        items: o.items.map((item) => ({
          name: item.dishSnapshot.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        time: o.createdAt
      }))
    }
  }
  /**
   * Search historical orders by filters: tableNumber, date range, guestName, status.
   */
  async searchOrders(filters: {
    tableNumber?: number
    startDate?: string
    endDate?: string
    guestName?: string
    status?: string
    limit?: number
  }): Promise<SearchOrderResult[]> {
    const where: any = {}

    if (filters.tableNumber) {
      where.tableNumber = filters.tableNumber
    }
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        const start = new Date(filters.startDate)
        if (!isNaN(start.getTime())) where.createdAt.gte = start
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate)
        if (!isNaN(end.getTime())) where.createdAt.lte = end
      }
    }
    if (filters.guestName) {
      where.guest = { name: { contains: filters.guestName } }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        guest: { select: { name: true } },
        table: { select: { number: true } },
        items: {
          include: { dishSnapshot: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(filters.limit || 10, 20)
    })

    return orders.map((o) => ({
      id: o.id,
      guestName: o.guest?.name || null,
      tableNumber: o.table?.number || null,
      status: o.status,
      totalAmount: o.totalAmount,
      items: o.items.map((item) => ({
        name: item.dishSnapshot.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      createdAt: o.createdAt
    }))
  }
}

export const adminService = new AdminService()
