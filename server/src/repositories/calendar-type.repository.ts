import prisma from '@/database'

export interface CreateCalendarTypeData {
  name: string
  label: string
  color: string
  category: string
  visible?: boolean
  createdById: number
}

export interface UpdateCalendarTypeData {
  label?: string
  color?: string
  category?: string
  visible?: boolean
}

export const calendarTypeRepository = {
  // Find all calendar types
  async findAll(filters?: { visible?: boolean; category?: string }) {
    return await prisma.calendarType.findMany({
      where: {
        ...(filters?.visible !== undefined && { visible: filters.visible }),
        ...(filters?.category && { category: filters.category })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [{ category: 'asc' }, { label: 'asc' }]
    })
  },

  // Find calendar type by ID
  async findById(id: number) {
    return await prisma.calendarType.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  },

  // Find calendar type by name
  async findByName(name: string) {
    return await prisma.calendarType.findUnique({
      where: { name },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  },

  // Create calendar type
  async create(data: CreateCalendarTypeData) {
    return await prisma.calendarType.create({
      data: {
        name: data.name,
        label: data.label,
        color: data.color,
        category: data.category,
        visible: data.visible ?? true,
        createdById: data.createdById
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  },

  // Update calendar type
  async update(id: number, data: UpdateCalendarTypeData) {
    return await prisma.calendarType.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.visible !== undefined && { visible: data.visible })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  },

  // Delete calendar type (only if no events use it)
  async delete(id: number) {
    // Check if any events use this type
    const eventCount = await prisma.calendarEvent.count({
      where: { typeId: id }
    })

    if (eventCount > 0) {
      throw new Error(`Cannot delete calendar type: ${eventCount} event(s) are using it`)
    }

    return await prisma.calendarType.delete({
      where: { id }
    })
  },

  // Toggle visibility
  async toggleVisibility(id: number) {
    const type = await prisma.calendarType.findUnique({
      where: { id },
      select: { visible: true }
    })

    if (!type) {
      throw new Error('Calendar type not found')
    }

    return await prisma.calendarType.update({
      where: { id },
      data: { visible: !type.visible },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }
}
