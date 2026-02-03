import {
  createAttachmentController,
  deleteAttachmentController,
  getAttachmentsController
} from '@/controllers/task-attachment.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import {
  GetAttachmentsRes,
  GetAttachmentsResType,
  DeleteAttachmentRes,
  DeleteAttachmentResType,
  TaskIdParam,
  TaskIdParamType,
  AttachmentIdParam,
  AttachmentIdParamType
} from '@/schemaValidations/task-attachment.schema'
import { EntityError } from '@/utils/errors'
import fastifyMultipart from '@fastify/multipart'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function taskAttachmentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Register multipart plugin for file uploads
  fastify.register(fastifyMultipart)

  // All routes require authentication
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook]))

  // Get all attachments for a task (any authenticated user can view)
  fastify.get<{ Reply: GetAttachmentsResType; Params: TaskIdParamType }>(
    '/:taskId/attachments',
    {
      schema: {
        response: {
          200: GetAttachmentsRes
        },
        params: TaskIdParam
      }
    },
    async (request, reply) => {
      const result = await getAttachmentsController(request.params.taskId)
      reply.send({
        message: 'Get attachments successfully',
        data: result as GetAttachmentsResType['data']
      })
    }
  )

  // Upload attachment (any authenticated user can upload)
  fastify.post<{ Reply: GetAttachmentsResType; Params: TaskIdParamType }>(
    '/:taskId/attachments',
    {
      schema: {
        response: {
          200: GetAttachmentsRes
        },
        params: TaskIdParam
      }
    },
    async (request, reply) => {
      const data = await request.file({
        limits: {
          fileSize: 1024 * 1024 * 10, // 10MB - Fastify will reject files larger than this
          fields: 1,
          files: 1
        }
      })

      if (!data) {
        throw new EntityError([{ field: 'file', message: 'File is required' }])
      }

      const userId = request.decodedAccessToken?.userId as number
      const result = await createAttachmentController(request.params.taskId, userId, data)
      reply.send({
        message: 'Upload attachment successfully',
        data: [result] as GetAttachmentsResType['data']
      })
    }
  )

  // Delete attachment (only uploader can delete)
  fastify.delete<{ Reply: DeleteAttachmentResType; Params: AttachmentIdParamType }>(
    '/attachments/:id',
    {
      schema: {
        response: {
          200: DeleteAttachmentRes
        },
        params: AttachmentIdParam
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await deleteAttachmentController(request.params.id, userId)
      reply.send(result)
    }
  )
}
