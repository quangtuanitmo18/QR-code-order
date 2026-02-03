import prisma from '@/database'

export const taskCommentRepository = {
  /**
   * Find all comments for a task
   */
  async findByTaskId(taskId: number) {
    return await prisma.taskComment.findMany({
      where: { taskId },
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
    })
  },

  /**
   * Find comment by ID
   */
  async findById(id: number) {
    return await prisma.taskComment.findUnique({
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

  /**
   * Create new comment
   */
  async create(data: { taskId: number; content: string; createdById: number }) {
    return await prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        content: data.content,
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

  /**
   * Update comment
   */
  async update(id: number, data: { content: string }) {
    return await prisma.taskComment.update({
      where: { id },
      data: {
        content: data.content
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

  /**
   * Delete comment
   */
  async delete(id: number): Promise<boolean> {
    const comment = await prisma.taskComment.findUnique({
      where: { id }
    })

    if (!comment) {
      return false
    }

    await prisma.taskComment.delete({
      where: { id }
    })

    return true
  }
}
