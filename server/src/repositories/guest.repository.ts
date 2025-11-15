import prisma from '@/database'

export const guestRepository = {
  // Find guest by ID
  async findById(id: number) {
    return await prisma.guest.findUniqueOrThrow({
      where: { id }
    })
  },

  // Create guest
  async create(data: { name: string; tableNumber: number }) {
    return await prisma.guest.create({
      data
    })
  },

  // Update guest
  async update(
    id: number,
    data: {
      refreshToken?: string | null
      refreshTokenExpiresAt?: Date | null
      name?: string
      tableNumber?: number | null
    }
  ) {
    return await prisma.guest.update({
      where: { id },
      data
    })
  },

  // Find table by number and token
  async findTableByNumberAndToken(tableNumber: number, token: string) {
    return await prisma.table.findUnique({
      where: {
        number: tableNumber,
        token
      }
    })
  },

  // Find table by number
  async findTableByNumber(tableNumber: number) {
    return await prisma.table.findUniqueOrThrow({
      where: {
        number: tableNumber
      }
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
    name: string
    price: number
    description: string
    image: string
    status: string
    dishId: number
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
    orderHandlerId: number | null
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

  // Get guest orders
  async findOrdersByGuestId(guestId: number) {
    return await prisma.order.findMany({
      where: { guestId },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      }
    })
  }
}
