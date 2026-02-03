import prisma from '@/database'
import { Task } from '@prisma/client'

interface FindAllFilters {
  status?: string
  category?: string
  priority?: string
  assignedToId?: number
  search?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status' | 'dueDate'
  sortOrder?: 'asc' | 'desc'
}

interface FindAllResult {
  tasks: Task[]
  total: number
}

export const taskRepository = {
  /**
   * Find all tasks with server-side filtering, search, pagination, and sorting
   */
  async findAll(filters?: FindAllFilters): Promise<FindAllResult> {
    const where: any = {}

    // Build dynamic WHERE clause based on filters
    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.assignedToId !== undefined) {
      where.assignedToId = filters.assignedToId
    }

    // Search by title (LIKE query)
    // Note: SQLite's contains is case-insensitive for ASCII by default
    if (filters?.search) {
      where.title = {
        contains: filters.search
      }
    }

    // Pagination
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 10
    const skip = (page - 1) * limit

    // Sorting
    const sortBy = filters?.sortBy ?? 'createdAt'
    const sortOrder = filters?.sortOrder ?? 'desc'
    const orderBy: any = { [sortBy]: sortOrder }

    // Get total count (for pagination)
    const total = await prisma.task.count({ where })

    // Get tasks with relations
    const tasks = await prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return { tasks, total }
  },

  /**
   * Find task by ID with relations
   */
  async findById(id: number) {
    return await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })
  },

  /**
   * Create new task
   */
  async create(data: {
    title: string
    description?: string | null
    status?: string
    category: string
    priority?: string
    dueDate?: Date | null
    assignedToId?: number | null
    createdById: number
  }): Promise<Task> {
    return await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'todo',
        category: data.category,
        priority: data.priority ?? 'Normal',
        dueDate: data.dueDate ?? null,
        assignedToId: data.assignedToId ?? null,
        createdById: data.createdById
      }
    })
  },

  /**
   * Update task
   */
  async update(
    id: number,
    data: {
      title?: string
      description?: string | null
      status?: string
      category?: string
      priority?: string
      dueDate?: Date | null
      assignedToId?: number | null
    }
  ): Promise<Task> {
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.category !== undefined) updateData.category = data.category
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId

    return await prisma.task.update({
      where: { id },
      data: updateData
    })
  },

  /**
   * Delete task (cascade deletes comments and attachments)
   */
  async delete(id: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return false
    }

    await prisma.task.delete({
      where: { id }
    })

    return true
  },

  /**
   * Count tasks by status (for statistics)
   * Uses the same WHERE clause as findAll for consistency
   */
  async countByStatus(filters?: Omit<FindAllFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>) {
    const where: any = {}

    // Build same WHERE clause as findAll
    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.assignedToId !== undefined) {
      where.assignedToId = filters.assignedToId
    }

    if (filters?.search) {
      where.title = {
        contains: filters.search
      }
    }

    // Get counts for each status
    const [total, completed, inProgress, pending] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'completed' } }),
      prisma.task.count({ where: { ...where, status: 'in_progress' } }),
      prisma.task.count({ where: { ...where, status: 'pending' } })
    ])

    return {
      total,
      completed,
      inProgress,
      pending
    }
  }
}
