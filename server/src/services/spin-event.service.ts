import prisma from '@/database'
import { spinEventRepository } from '@/repositories/spin-event.repository'
import { EntityError } from '@/utils/errors'

export const spinEventService = {
  /**
   * Get all spin events
   */
  async getAllEvents(filters?: { isActive?: boolean; startDate?: Date; endDate?: Date }) {
    return await spinEventRepository.findAll(filters)
  },

  /**
   * Get active spin events
   */
  async getActiveEvents() {
    return await spinEventRepository.findActive()
  },

  /**
   * Get active spin events for a specific employee
   */
  async getActiveEventsForEmployee(employeeId: number) {
    return await spinEventRepository.findActiveForEmployee(employeeId)
  },

  /**
   * Get spin event by ID
   */
  async getEventById(id: number) {
    const event = await spinEventRepository.findById(id)
    if (!event) {
      throw new EntityError([{ field: 'id', message: 'Spin event not found' }])
    }
    return event
  },

  /**
   * Create new spin event
   */
  async createEvent(data: {
    name: string
    description?: string | null
    startDate: Date
    endDate?: Date | null
    isActive?: boolean
    createdById: number
    employeeIds?: number[]
  }) {
    // Validate dates
    if (data.endDate && data.endDate < data.startDate) {
      throw new EntityError([{ field: 'endDate', message: 'End date must be after start date' }])
    }

    // Create event
    const event = await spinEventRepository.create({
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      createdById: data.createdById
    })

    // Create spins for assigned employees if any
    if (data.employeeIds && data.employeeIds.length > 0) {
      // Create spins for each employee (rewardId will be set when spin is executed)
      await prisma.$transaction(async (tx) => {
        for (const employeeId of data.employeeIds!) {
          await tx.employeeSpin.create({
            data: {
              employeeId,
              // rewardId is optional - will be set when spin is executed
              eventId: event.id,
              status: 'PENDING',
              expiredAt: data.endDate || undefined,
              createdById: data.createdById
            }
          })
        }
      })
    }

    return event
  },

  /**
   * Update spin event
   */
  async updateEvent(
    id: number,
    data: {
      name?: string
      description?: string | null
      startDate?: Date
      endDate?: Date | null
      isActive?: boolean
      employeeIds?: number[]
    }
  ) {
    // Check if event exists
    const existingEvent = await spinEventRepository.findById(id)
    if (!existingEvent) {
      throw new EntityError([{ field: 'id', message: 'Spin event not found' }])
    }

    // Validate dates if both are provided
    const startDate = data.startDate ?? existingEvent.startDate
    const endDate = data.endDate !== undefined ? data.endDate : existingEvent.endDate

    if (endDate && endDate < startDate) {
      throw new EntityError([{ field: 'endDate', message: 'End date must be after start date' }])
    }

    // Update event basic info
    const updatedEvent = await spinEventRepository.update(id, {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive
    })

    // Update employee assignments if employeeIds provided
    if (data.employeeIds !== undefined) {
      // Get existing spins for this event
      const existingSpins = await prisma.employeeSpin.findMany({
        where: { eventId: id },
        select: { id: true, employeeId: true }
      })

      const existingEmployeeIds = existingSpins.map((s) => s.employeeId)
      const newEmployeeIds = data.employeeIds || []

      // Find employees to add and remove
      const toAdd = newEmployeeIds.filter((id) => !existingEmployeeIds.includes(id))
      const toRemove = existingEmployeeIds.filter((id) => !newEmployeeIds.includes(id))

      // Create new spins for added employees (rewardId will be set when spin is executed)
      if (toAdd.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const employeeId of toAdd) {
            await tx.employeeSpin.create({
              data: {
                employeeId,
                // rewardId is optional - will be set when spin is executed
                eventId: id,
                status: 'PENDING',
                expiredAt: endDate || undefined,
                createdById: existingEvent.createdById
              }
            })
          }
        })
      }

      // Remove spins for removed employees (only if status is PENDING)
      if (toRemove.length > 0) {
        await prisma.employeeSpin.deleteMany({
          where: {
            eventId: id,
            employeeId: { in: toRemove },
            status: 'PENDING' // Only delete pending spins
          }
        })
      }
    }

    return updatedEvent
  },

  /**
   * Delete spin event
   */
  async deleteEvent(id: number) {
    const event = await spinEventRepository.findById(id)
    if (!event) {
      throw new EntityError([{ field: 'id', message: 'Spin event not found' }])
    }

    const deleted = await spinEventRepository.delete(id)
    if (!deleted) {
      throw new EntityError([{ field: 'id', message: 'Failed to delete spin event' }])
    }

    return { success: true }
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: number) {
    const event = await spinEventRepository.findById(id)
    if (!event) {
      throw new EntityError([{ field: 'id', message: 'Spin event not found' }])
    }

    return await spinEventRepository.toggleActive(id)
  }
}
