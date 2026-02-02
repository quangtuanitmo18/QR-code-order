import prisma from '@/database'
import { Prisma } from '@prisma/client'

export interface SpinRewardFilters {
  isActive?: boolean
}

export interface CreateSpinRewardData {
  name: string
  description?: string | null
  type: string
  value?: string | null
  probability: number
  color: string
  icon?: string | null
  isActive?: boolean
  order: number
  maxQuantity?: number | null
  eventId: number // Required: must belong to an event
}

export interface UpdateSpinRewardData {
  name?: string
  description?: string | null
  type?: string
  value?: string | null
  probability?: number
  color?: string
  icon?: string | null
  isActive?: boolean
  order?: number
  maxQuantity?: number | null
}

export interface RewardOrder {
  id: number
  order: number
}

export const spinRewardRepository = {
  // Find all rewards
  async findAll(filters?: SpinRewardFilters) {
    return await prisma.spinReward.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive })
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })
  },

  // Find active rewards (for display on wheel)
  async findActive() {
    return await prisma.spinReward.findMany({
      where: {
        isActive: true
      },
      orderBy: { order: 'asc' }
    })
  },

  // Find available rewards (active and not exhausted) - filter by active event
  async findAvailable(eventId?: number) {
    const now = new Date()
    // Get all active rewards from active events first, then filter in memory
    // SQLite doesn't support comparing two columns directly in WHERE clause easily
    const allActive = await prisma.spinReward.findMany({
      where: {
        isActive: true,
        event: {
          isActive: true,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }]
        },
        ...(eventId && { eventId })
      },
      orderBy: { order: 'asc' }
    })

    // Filter out exhausted rewards (where currentQuantity >= maxQuantity)
    return allActive.filter((reward) => reward.maxQuantity === null || reward.currentQuantity < reward.maxQuantity)
  },

  // Find reward by ID
  async findById(id: number) {
    return await prisma.spinReward.findUnique({
      where: { id }
    })
  },

  // Create reward
  async create(data: CreateSpinRewardData) {
    return await prisma.spinReward.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        value: data.value ?? null,
        probability: data.probability,
        color: data.color,
        icon: data.icon ?? null,
        isActive: data.isActive ?? true,
        order: data.order,
        maxQuantity: data.maxQuantity ?? null,
        currentQuantity: 0,
        version: 0,
        eventId: data.eventId
      }
    })
  },

  // Update reward
  async update(id: number, data: UpdateSpinRewardData) {
    return await prisma.spinReward.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.maxQuantity !== undefined && { maxQuantity: data.maxQuantity })
      }
    })
  },

  // Soft delete (set isActive = false)
  async delete(id: number) {
    return await prisma.spinReward.update({
      where: { id },
      data: { isActive: false }
    })
  },

  // Update orders for multiple rewards
  async updateOrders(orders: RewardOrder[]) {
    // Use transaction to update all orders atomically
    return await prisma.$transaction(
      orders.map(({ id, order }) =>
        prisma.spinReward.update({
          where: { id },
          data: { order }
        })
      )
    )
  },

  /**
   * Atomic increment for currentQuantity.
   * Only increments if maxQuantity is NULL or currentQuantity < maxQuantity.
   * Returns number of rows affected (0 if exhausted, 1 if successful).
   * Use within transaction for race-condition safety.
   */
  async incrementQuantityAtomic(id: number): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE SpinReward
      SET currentQuantity = currentQuantity + 1,
          version = version + 1,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ${id}
        AND isActive = 1
        AND (maxQuantity IS NULL OR currentQuantity < maxQuantity)
    `
    return Number(result)
  }
}
