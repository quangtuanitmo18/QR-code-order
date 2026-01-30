import { calendarTypeRepository } from '@/repositories/calendar-type.repository'
import { EntityError } from '@/utils/errors'

export const calendarTypeService = {
  /**
   * Get all calendar types
   */
  async getCalendarTypes(filters?: { visible?: boolean; category?: string }) {
    const types = await calendarTypeRepository.findAll(filters)
    return types.map((type) => ({
      id: type.id,
      name: type.name,
      label: type.label,
      color: type.color,
      category: type.category,
      visible: type.visible,
      createdBy: type.createdBy,
      createdAt: type.createdAt.toISOString(),
      updatedAt: type.updatedAt.toISOString()
    }))
  },

  /**
   * Get calendar type by ID
   * @throws {EntityError} if not found
   */
  async getCalendarTypeById(id: number) {
    const type = await calendarTypeRepository.findById(id)

    if (!type) {
      throw new EntityError([{ field: 'id', message: 'Calendar type not found' }])
    }

    return {
      id: type.id,
      name: type.name,
      label: type.label,
      color: type.color,
      category: type.category,
      visible: type.visible,
      createdBy: type.createdBy,
      createdAt: type.createdAt.toISOString(),
      updatedAt: type.updatedAt.toISOString()
    }
  },

  /**
   * Create calendar type
   * @throws {EntityError} if name already exists
   */
  async createCalendarType(data: {
    name: string
    label: string
    color: string
    category: string
    visible?: boolean
    createdById: number
  }) {
    // Check if name already exists
    const existing = await calendarTypeRepository.findByName(data.name)
    if (existing) {
      throw new EntityError([{ field: 'name', message: 'Calendar type name already exists' }])
    }

    const type = await calendarTypeRepository.create({
      name: data.name,
      label: data.label,
      color: data.color,
      category: data.category,
      visible: data.visible ?? true,
      createdById: data.createdById
    })

    return {
      id: type.id,
      name: type.name,
      label: type.label,
      color: type.color,
      category: type.category,
      visible: type.visible,
      createdBy: type.createdBy,
      createdAt: type.createdAt.toISOString(),
      updatedAt: type.updatedAt.toISOString()
    }
  },

  /**
   * Update calendar type
   * @throws {EntityError} if not found
   */
  async updateCalendarType(
    id: number,
    data: {
      label?: string
      color?: string
      category?: string
      visible?: boolean
    }
  ) {
    const type = await calendarTypeRepository.findById(id)

    if (!type) {
      throw new EntityError([{ field: 'id', message: 'Calendar type not found' }])
    }

    const updated = await calendarTypeRepository.update(id, data)

    return {
      id: updated.id,
      name: updated.name,
      label: updated.label,
      color: updated.color,
      category: updated.category,
      visible: updated.visible,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  },

  /**
   * Delete calendar type
   * @throws {EntityError} if not found or if events are using it
   */
  async deleteCalendarType(id: number) {
    const type = await calendarTypeRepository.findById(id)

    if (!type) {
      throw new EntityError([{ field: 'id', message: 'Calendar type not found' }])
    }

    try {
      await calendarTypeRepository.delete(id)
      return { success: true }
    } catch (error: any) {
      throw new EntityError([{ field: 'id', message: error.message }])
    }
  },

  /**
   * Toggle visibility
   * @throws {EntityError} if not found
   */
  async toggleVisibility(id: number) {
    const type = await calendarTypeRepository.findById(id)

    if (!type) {
      throw new EntityError([{ field: 'id', message: 'Calendar type not found' }])
    }

    const updated = await calendarTypeRepository.toggleVisibility(id)

    return {
      id: updated.id,
      name: updated.name,
      label: updated.label,
      color: updated.color,
      category: updated.category,
      visible: updated.visible,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  }
}
