import prisma from '@/database'

export const dishRepository = {
  // ============= DISH OPERATIONS =============

  // Get all dishes
  async findAll() {
    return await prisma.dish.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  // Get dishes with pagination
  async findWithPagination(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [items, totalItem] = await Promise.all([
      prisma.dish.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.dish.count()
    ])

    return {
      items,
      totalItem,
      totalPage: Math.ceil(totalItem / limit)
    }
  },

  // Get dish by ID
  async findById(id: number) {
    return await prisma.dish.findUniqueOrThrow({
      where: { id }
    })
  },

  // Create dish
  async create(data: { name: string; price: number; description: string; image: string; status?: string }) {
    return await prisma.dish.create({
      data
    })
  },

  // Update dish
  async update(id: number, data: { name: string; price: number; description: string; image: string; status?: string }) {
    return await prisma.dish.update({
      where: { id },
      data
    })
  },

  // Delete dish
  async delete(id: number) {
    return await prisma.dish.delete({
      where: { id }
    })
  },

  // Count dishes
  async count() {
    return await prisma.dish.count()
  },

  // ============= DISH SNAPSHOT OPERATIONS =============

  // Create dish snapshot (used when creating orders)
  async createSnapshot(data: {
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

  // Find dish snapshot by ID
  async findSnapshotById(id: number) {
    return await prisma.dishSnapshot.findUnique({
      where: { id }
    })
  },

  // Find dish snapshots by dish ID
  async findSnapshotsByDishId(dishId: number) {
    return await prisma.dishSnapshot.findMany({
      where: { dishId },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}
