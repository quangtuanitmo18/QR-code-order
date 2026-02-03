import prisma from '@/database'
import { taskCommentRepository } from '@/repositories/task-comment.repository'
import { EntityError } from '@/utils/errors'

export const taskCommentService = {
  /**
   * Get all comments for a task
   */
  async getCommentsByTaskId(taskId: number) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      throw new EntityError([{ field: 'taskId', message: 'Task not found' }])
    }

    return await taskCommentRepository.findByTaskId(taskId)
  },

  /**
   * Create new comment
   */
  async createComment(data: { taskId: number; content: string; createdById: number }) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId }
    })

    if (!task) {
      throw new EntityError([{ field: 'taskId', message: 'Task not found' }])
    }

    // Validate content
    if (!data.content || data.content.trim().length === 0) {
      throw new EntityError([{ field: 'content', message: 'Content is required' }])
    }

    if (data.content.length > 5000) {
      throw new EntityError([{ field: 'content', message: 'Content must be less than 5000 characters' }])
    }

    return await taskCommentRepository.create({
      taskId: data.taskId,
      content: data.content.trim(),
      createdById: data.createdById
    })
  },

  /**
   * Update comment
   */
  async updateComment(id: number, data: { content: string }, userId: number) {
    // Check if comment exists
    const comment = await taskCommentRepository.findById(id)
    if (!comment) {
      throw new EntityError([{ field: 'id', message: 'Comment not found' }])
    }

    // Check if user is the creator
    if (comment.createdById !== userId) {
      throw new EntityError([{ field: 'id', message: 'You can only edit your own comments' }])
    }

    // Validate content
    if (!data.content || data.content.trim().length === 0) {
      throw new EntityError([{ field: 'content', message: 'Content is required' }])
    }

    if (data.content.length > 5000) {
      throw new EntityError([{ field: 'content', message: 'Content must be less than 5000 characters' }])
    }

    return await taskCommentRepository.update(id, {
      content: data.content.trim()
    })
  },

  /**
   * Delete comment
   */
  async deleteComment(id: number, userId: number) {
    // Check if comment exists
    const comment = await taskCommentRepository.findById(id)
    if (!comment) {
      throw new EntityError([{ field: 'id', message: 'Comment not found' }])
    }

    // Check if user is the creator
    if (comment.createdById !== userId) {
      throw new EntityError([{ field: 'id', message: 'You can only delete your own comments' }])
    }

    const deleted = await taskCommentRepository.delete(id)
    if (!deleted) {
      throw new EntityError([{ field: 'id', message: 'Failed to delete comment' }])
    }

    return { success: true }
  }
}
