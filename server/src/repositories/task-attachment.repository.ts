import prisma from '@/database'

export const taskAttachmentRepository = {
  /**
   * Find all attachments for a task
   */
  async findByTaskId(taskId: number) {
    return await prisma.taskAttachment.findMany({
      where: { taskId },
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
    })
  },

  /**
   * Find attachment by ID
   */
  async findById(id: number) {
    return await prisma.taskAttachment.findUnique({
      where: { id },
      include: {
        uploadedBy: {
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
   * Create new attachment
   */
  async create(data: {
    taskId: number
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    uploadedById: number
  }) {
    return await prisma.taskAttachment.create({
      data: {
        taskId: data.taskId,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedById: data.uploadedById
      },
      include: {
        uploadedBy: {
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
   * Delete attachment
   */
  async delete(id: number): Promise<boolean> {
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id }
    })

    if (!attachment) {
      return false
    }

    await prisma.taskAttachment.delete({
      where: { id }
    })

    return true
  }
}
