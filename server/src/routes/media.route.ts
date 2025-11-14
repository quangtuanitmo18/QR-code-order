import { uploadImage } from '@/controllers/media.controller'
import { pauseApiHook, requireLoginedHook } from '@/hooks/auth.hooks'
import { UploadImageRes, UploadImageResType } from '@/schemaValidations/media.schema'
import fastifyMultipart from '@fastify/multipart'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function mediaRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(fastifyMultipart)
  // Allow any logged-in user (Owner, Employee, or Guest) to upload images
  fastify.addHook(
    'preValidation',
    fastify.auth([requireLoginedHook, pauseApiHook], {
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
        throw new Error('Không tìm thấy file')
      }
      const url = await uploadImage(data)
      return reply.send({ message: 'Upload ảnh thành công', data: url })
    }
  )
}
