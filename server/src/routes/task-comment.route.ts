import {
  createCommentController,
  deleteCommentController,
  getCommentsController,
  updateCommentController
} from '@/controllers/task-comment.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import {
  CreateCommentBody,
  CreateCommentBodyType,
  CreateCommentRes,
  CreateCommentResType,
  DeleteCommentRes,
  DeleteCommentResType,
  GetCommentsRes,
  GetCommentsResType,
  TaskIdParam,
  TaskIdParamType,
  CommentIdParam,
  CommentIdParamType,
  UpdateCommentBody,
  UpdateCommentBodyType,
  UpdateCommentRes,
  UpdateCommentResType
} from '@/schemaValidations/task-comment.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function taskCommentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // All routes require authentication
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook]))

  // Get all comments for a task (any authenticated user can view)
  fastify.get<{ Reply: GetCommentsResType; Params: TaskIdParamType }>(
    '/:taskId/comments',
    {
      schema: {
        response: {
          200: GetCommentsRes
        },
        params: TaskIdParam
      }
    },
    async (request, reply) => {
      const result = await getCommentsController(request.params.taskId)
      reply.send({
        message: 'Get comments successfully',
        data: result as GetCommentsResType['data']
      })
    }
  )

  // Create comment (any authenticated user can create)
  fastify.post<{ Reply: CreateCommentResType; Params: TaskIdParamType; Body: CreateCommentBodyType }>(
    '/:taskId/comments',
    {
      schema: {
        response: {
          200: CreateCommentRes
        },
        params: TaskIdParam,
        body: CreateCommentBody
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await createCommentController(request.params.taskId, userId, request.body)
      reply.send({
        message: 'Create comment successfully',
        data: result as CreateCommentResType['data']
      })
    }
  )

  // Update comment (only comment creator can update)
  fastify.put<{ Reply: UpdateCommentResType; Params: CommentIdParamType; Body: UpdateCommentBodyType }>(
    '/comments/:id',
    {
      schema: {
        response: {
          200: UpdateCommentRes
        },
        params: CommentIdParam,
        body: UpdateCommentBody
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await updateCommentController(request.params.id, userId, request.body)
      reply.send({
        message: 'Update comment successfully',
        data: result as UpdateCommentResType['data']
      })
    }
  )

  // Delete comment (only comment creator can delete)
  fastify.delete<{ Reply: DeleteCommentResType; Params: CommentIdParamType }>(
    '/comments/:id',
    {
      schema: {
        response: {
          200: DeleteCommentRes
        },
        params: CommentIdParam
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await deleteCommentController(request.params.id, userId)
      reply.send(result)
    }
  )
}
