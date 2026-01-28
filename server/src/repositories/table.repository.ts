import prisma from '@/database'

export const tableRepository = {
  // Find all tables
  async findAll() {
    return await prisma.table.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  // Find table by number
  async findByNumber(number: number) {
    return await prisma.table.findUniqueOrThrow({
      where: {
        number
      }
    })
  },

  // Create table
  async create(data: { number: number; capacity: number; status: string; token: string }) {
    return await prisma.table.create({
      data
    })
  },

  // Update table
  async update(number: number, data: { status?: string; capacity?: number; token?: string }) {
    return await prisma.table.update({
      where: {
        number
      },
      data
    })
  },

  // Update guest refresh tokens by table number
  async clearGuestRefreshTokens(tableNumber: number) {
    return await prisma.guest.updateMany({
      where: {
        tableNumber
      },
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null
      }
    })
  },

  // Delete table
  async delete(number: number) {
    return await prisma.table.delete({
      where: {
        number
      }
    })
  }
}
