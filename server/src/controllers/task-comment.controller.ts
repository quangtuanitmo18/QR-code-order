import {
  CreateCommentBodyType,
  TaskIdParamType,
  CommentIdParamType,
  UpdateCommentBodyType
} from '@/schemaValidations/task-comment.schema'
import { taskCommentService } from '@/services/task-comment.service'

export const getCommentsController = async (taskId: number) => {
  return await taskCommentService.getCommentsByTaskId(taskId)
}

export const createCommentController = async (taskId: number, userId: number, body: CreateCommentBodyType) => {
  return await taskCommentService.createComment({
    taskId,
    content: body.content,
    createdById: userId
  })
}

export const updateCommentController = async (id: number, userId: number, body: UpdateCommentBodyType) => {
  return await taskCommentService.updateComment(id, body, userId)
}

export const deleteCommentController = async (id: number, userId: number) => {
  await taskCommentService.deleteComment(id, userId)
  return { message: 'Comment deleted successfully' }
}
