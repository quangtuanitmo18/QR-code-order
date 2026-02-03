import {
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  getTasksController,
  updateTaskController
} from '@/controllers/task.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  CreateTaskBody,
  CreateTaskBodyType,
  CreateTaskRes,
  CreateTaskResType,
  DeleteTaskRes,
  DeleteTaskResType,
  GetTaskRes,
  GetTaskResType,
  GetTasksQueryParams,
  GetTasksQueryParamsType,
  GetTasksRes,
  GetTasksResType,
  TaskIdParam,
  TaskIdParamType,
  UpdateTaskBody,
  UpdateTaskBodyType,
  UpdateTaskRes,
  UpdateTaskResType
} from '@/schemaValidations/task.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function taskRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // All routes require authentication
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook]))

  // Get all tasks (any authenticated user can view)
  fastify.get<{ Reply: GetTasksResType; Querystring: GetTasksQueryParamsType }>(
    '/',
    {
      schema: {
        response: {
          200: GetTasksRes
        },
        querystring: GetTasksQueryParams
      }
    },
    async (request, reply) => {
      const result = await getTasksController(request.query)
      reply.send({
        message: 'Get tasks successfully',
        data: result as GetTasksResType['data']
      })
    }
  )

  // Get task by ID (any authenticated user can view)
  fastify.get<{ Reply: GetTaskResType; Params: TaskIdParamType }>(
    '/:id',
    {
      schema: {
        response: {
          200: GetTaskRes
        },
        params: TaskIdParam
      }
    },
    async (request, reply) => {
      const result = await getTaskByIdController(request.params.id)
      reply.send({
        message: 'Get task successfully',
        data: result as GetTaskResType['data']
      })
    }
  )

  // Create task (Owner only)
  fastify.post<{ Reply: CreateTaskResType; Body: CreateTaskBodyType }>(
    '/',
    {
      preValidation: [fastify.auth([requireOwnerHook])],
      schema: {
        response: {
          200: CreateTaskRes
        },
        body: CreateTaskBody
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await createTaskController(userId, request.body)
      reply.send({
        message: 'Create task successfully',
        data: result as CreateTaskResType['data']
      })
    }
  )

  // Update task (Owner only)
  fastify.put<{ Reply: UpdateTaskResType; Params: TaskIdParamType; Body: UpdateTaskBodyType }>(
    '/:id',
    {
      preValidation: [fastify.auth([requireOwnerHook])],
      schema: {
        response: {
          200: UpdateTaskRes
        },
        params: TaskIdParam,
        body: UpdateTaskBody
      }
    },
    async (request, reply) => {
      const result = await updateTaskController(request.params.id, request.body)
      reply.send({
        message: 'Update task successfully',
        data: result as UpdateTaskResType['data']
      })
    }
  )

  // Delete task (Owner only)
  fastify.delete<{ Reply: DeleteTaskResType; Params: TaskIdParamType }>(
    '/:id',
    {
      preValidation: [fastify.auth([requireOwnerHook])],
      schema: {
        response: {
          200: DeleteTaskRes
        },
        params: TaskIdParam
      }
    },
    async (request, reply) => {
      await deleteTaskController(request.params.id)
      reply.send({
        message: 'Delete task successfully'
      })
    }
  )
}
