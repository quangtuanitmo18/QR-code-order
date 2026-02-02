import prisma from '@/database';
import { SpinEvent } from '@prisma/client';

export const spinEventRepository = {
  /**
   * Find all spin events with optional filters
   */
  async findAll(filters?: { isActive?: boolean; startDate?: Date; endDate?: Date }) {
    const where: any = {}

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.startDate || filters?.endDate) {
      where.OR = []
      if (filters.startDate) {
        where.OR.push({
          startDate: { lte: filters.startDate }
        })
      }
      if (filters.endDate) {
        where.OR.push({
          OR: [{ endDate: null }, { endDate: { gte: filters.endDate } }]
        })
      }
    }

    return await prisma.spinEvent.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            rewards: true,
            spins: true
          }
        }
      },
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }]
    })
  },

  /**
   * Find active spin events (currently running)
   */
  async findActive() {
    const now = new Date()
    return await prisma.spinEvent.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            rewards: true,
            spins: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })
  },

  /**
   * Find spin event by ID
   */
  async findById(id: number) {
    return await prisma.spinEvent.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rewards: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        spins: {
          select: {
            id: true,
            employeeId: true,
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            rewards: true,
            spins: true
          }
        }
      }
    })
  },

  /**
   * Create new spin event
   */
  async create(data: {
    name: string
    description?: string | null
    startDate: Date
    endDate?: Date | null
    isActive?: boolean
    createdById: number
  }): Promise<SpinEvent> {
    return await prisma.spinEvent.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        isActive: data.isActive ?? true,
        createdById: data.createdById
      }
    })
  },

  /**
   * Update spin event
   */
  async update(
    id: number,
    data: {
      name?: string
      description?: string | null
      startDate?: Date
      endDate?: Date | null
      isActive?: boolean
    }
  ): Promise<SpinEvent> {
    return await prisma.spinEvent.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })
  },

  /**
   * Delete spin event (soft delete by setting isActive to false)
   * Or hard delete if no rewards/spins associated
   */
  async delete(id: number): Promise<boolean> {
    // Check if event has rewards or spins
    const event = await prisma.spinEvent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rewards: true,
            spins: true
          }
        }
      }
    })

    if (!event) {
      return false
    }

    // If has rewards or spins, soft delete (set isActive to false)
    if (event._count.rewards > 0 || event._count.spins > 0) {
      await prisma.spinEvent.update({
        where: { id },
        data: { isActive: false }
      })
      return true
    }

    // Otherwise, hard delete
    await prisma.spinEvent.delete({
      where: { id }
    })
    return true
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: number): Promise<SpinEvent> {
    const event = await prisma.spinEvent.findUnique({
      where: { id }
    })

    if (!event) {
      throw new Error('Spin event not found')
    }

    return await prisma.spinEvent.update({
      where: { id },
      data: { isActive: !event.isActive }
    })
  }
}
