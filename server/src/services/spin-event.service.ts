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
  }) {
    // Validate dates
    if (data.endDate && data.endDate < data.startDate) {
      throw new EntityError([{ field: 'endDate', message: 'End date must be after start date' }])
    }

    return await spinEventRepository.create(data)
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

    return await spinEventRepository.update(id, data)
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
