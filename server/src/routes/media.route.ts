import { uploadImage } from '@/controllers/media.controller'
import { pauseApiHook, requireEmployeeHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { UploadImageRes, UploadImageResType } from '@/schemaValidations/media.schema'
import fastifyMultipart from '@fastify/multipart'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function mediaRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(fastifyMultipart)
  fastify.addHook(
    'preValidation',
    fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
      relation: 'and'
    })
  )

  fastify.post<{
    Reply: UploadImageResType
  }>(
    '/upload',
    {
      schema: {
        response: {
          200: UploadImageRes
        }
      }
    },
    async (request, reply) => {
      const data = await request.file({
        limits: {
          fileSize: 1024 * 1024 * 10, // 10MB,
          fields: 1,
          files: 1
        }
      })
      if (!data) {
        throw new Error('file not found')
      }
      const url = await uploadImage(data)
      return reply.send({ message: 'Upload image successfully', data: url })
    }
  )
}
