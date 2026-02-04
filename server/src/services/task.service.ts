import envConfig from '@/config'
import prisma from '@/database'
import { taskAttachmentRepository } from '@/repositories/task-attachment.repository'
import { taskRepository } from '@/repositories/task.repository'
import { EntityError } from '@/utils/errors'
import fs from 'fs'
import path from 'path'

interface GetTasksParams {
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

export const taskService = {
  /**
   * Get tasks with server-side filtering, search, pagination, sorting, and statistics
   */
  async getTasks(params?: GetTasksParams) {
    const { tasks, total } = await taskRepository.findAll(params)

    // Calculate pagination metadata
    const page = params?.page ?? 1
    const limit = params?.limit ?? 10
    const totalPages = Math.ceil(total / limit)

    // Get statistics based on current filters
    const statistics = await taskRepository.countByStatus()

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      statistics
    }
  },

  /**
   * Get task by ID with relations
   */
  async getTaskById(id: number) {
    const task = await taskRepository.findById(id)
    if (!task) {
      throw new EntityError([{ field: 'id', message: 'Task not found' }])
    }

    // Add fileUrl to attachments
    const taskWithFileUrls = {
      ...task,
      attachments: task.attachments.map((attachment: any) => ({
        ...attachment,
        fileUrl: `/static/tasks/${attachment.filePath}`
      }))
    }

    return taskWithFileUrls
  },

  /**
   * Create new task
   */
  async createTask(data: {
    title: string
    description?: string | null
    status?: string
    category: string
    priority?: string
    dueDate?: Date | null
    assignedToId?: number | null
    createdById: number
  }) {
    // Validate status
    const validStatuses = ['todo', 'in_progress', 'completed', 'pending']
    if (data.status && !validStatuses.includes(data.status)) {
      throw new EntityError([{ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }])
    }

    // Validate category
    const validCategories = ['Feature', 'Bug', 'Docs', 'Improvement', 'Refactor']
    if (!validCategories.includes(data.category)) {
      throw new EntityError([{ field: 'category', message: `Category must be one of: ${validCategories.join(', ')}` }])
    }

    // Validate priority
    const validPriorities = ['Critical', 'Important', 'Normal', 'Minor']
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new EntityError([{ field: 'priority', message: `Priority must be one of: ${validPriorities.join(', ')}` }])
    }

    // Validate assigned user exists (if provided)
    if (data.assignedToId) {
      const user = await prisma.account.findUnique({
        where: { id: data.assignedToId }
      })
      if (!user) {
        throw new EntityError([{ field: 'assignedToId', message: 'Assigned user not found' }])
      }
    }

    // Create task
    const task = await taskRepository.create({
      title: data.title,
      description: data.description,
      status: data.status ?? 'todo',
      category: data.category,
      priority: data.priority ?? 'Normal',
      dueDate: data.dueDate,
      assignedToId: data.assignedToId,
      createdById: data.createdById
    })

    // Fetch with relations
    return await taskRepository.findById(task.id)
  },

  /**
   * Update task
   */
  async updateTask(
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
  ) {
    // Check if task exists
    const existingTask = await taskRepository.findById(id)
    if (!existingTask) {
      throw new EntityError([{ field: 'id', message: 'Task not found' }])
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses = ['todo', 'in_progress', 'completed', 'pending']
      if (!validStatuses.includes(data.status)) {
        throw new EntityError([{ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }])
      }
    }

    // Validate category if provided
    if (data.category) {
      const validCategories = ['Feature', 'Bug', 'Docs', 'Improvement', 'Refactor']
      if (!validCategories.includes(data.category)) {
        throw new EntityError([
          { field: 'category', message: `Category must be one of: ${validCategories.join(', ')}` }
        ])
      }
    }

    // Validate priority if provided
    if (data.priority) {
      const validPriorities = ['Critical', 'Important', 'Normal', 'Minor']
      if (!validPriorities.includes(data.priority)) {
        throw new EntityError([
          { field: 'priority', message: `Priority must be one of: ${validPriorities.join(', ')}` }
        ])
      }
    }

    // Validate assigned user exists (if provided)
    if (data.assignedToId !== undefined && data.assignedToId !== null) {
      const user = await prisma.account.findUnique({
        where: { id: data.assignedToId }
      })
      if (!user) {
        throw new EntityError([{ field: 'assignedToId', message: 'Assigned user not found' }])
      }
    }

    // Update task
    await taskRepository.update(id, data)

    // Fetch updated task with relations
    return await taskRepository.findById(id)
  },

  /**
   * Delete task (cascade deletes comments and attachments)
   */
  async deleteTask(id: number) {
    const task = await taskRepository.findById(id)
    if (!task) {
      throw new EntityError([{ field: 'id', message: 'Task not found' }])
    }

    // Delete all attachments and their physical files before deleting task
    const attachments = await taskAttachmentRepository.findByTaskId(id)

    // Delete physical files
    const TASKS_UPLOAD_DIR = path.resolve(envConfig.UPLOAD_FOLDER, 'tasks')

    for (const attachment of attachments) {
      const filePath = path.resolve(TASKS_UPLOAD_DIR, attachment.filePath)
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath)
        } catch (error) {
          // Log error but continue with deletion
          console.error(`Failed to delete attachment file: ${filePath}`, error)
        }
      }
    }

    // Delete task (cascade will handle DB records for comments and attachments)
    const deleted = await taskRepository.delete(id)
    if (!deleted) {
      throw new EntityError([{ field: 'id', message: 'Failed to delete task' }])
    }

    return { success: true }
  },

  /**
   * Get task statistics based on current filters
   */
  async getTaskStatistics() {
    return await taskRepository.countByStatus()
  }
}
