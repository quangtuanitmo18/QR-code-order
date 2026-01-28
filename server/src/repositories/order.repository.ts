import prisma from '@/database'

export const orderRepository = {
  // Find guest by ID
  async findGuestById(id: number) {
    return await prisma.guest.findUniqueOrThrow({
      where: { id }
    })
  },

  // Find table by number
  async findTableByNumber(number: number) {
    return await prisma.table.findUniqueOrThrow({
      where: { number }
    })
  },

  // Find dish by ID
  async findDishById(id: number) {
    return await prisma.dish.findUniqueOrThrow({
      where: { id }
    })
  },

  // Create dish snapshot
  async createDishSnapshot(data: {
    description: string
    image: string
    name: string
    price: number
    dishId: number
    status: string
  }) {
    return await prisma.dishSnapshot.create({
      data
    })
  },

  // Create order
  async createOrder(data: {
    dishSnapshotId: number
    guestId: number
    quantity: number
    tableNumber: number
    orderHandlerId: number
    status: string
  }) {
    return await prisma.order.create({
      data,
      include: {
        dishSnapshot: true,
        guest: true,
        orderHandler: true
      }
    })
  },

  // Find socket by guestId
  async findSocketByGuestId(guestId: number) {
    return await prisma.socket.findUnique({
      where: { guestId }
    })
  },

  // Get orders with filters
  async findOrders(filters: { fromDate?: Date; toDate?: Date }) {
    return await prisma.order.findMany({
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        createdAt: {
          gte: filters.fromDate,
          lte: filters.toDate
        }
      }
    })
  },

  // Find order by ID
  async findOrderById(orderId: number) {
    return await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true,
        table: true
      }
    })
  },

  // Find order with dishSnapshot
  async findOrderWithDishSnapshot(orderId: number) {
    return await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        dishSnapshot: true
      }
    })
  },

  // Update order
  async updateOrder(
    orderId: number,
    data: {
      status?: string
      dishSnapshotId?: number
      quantity?: number
      orderHandlerId?: number
    }
  ) {
    return await prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      }
    })
  }
}
