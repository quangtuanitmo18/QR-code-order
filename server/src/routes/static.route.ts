import envConfig from '@/config'
import fastifyStatic from '@fastify/static'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import path from 'path'

export default async function staticRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(fastifyStatic, {
    root: path.resolve(envConfig.UPLOAD_FOLDER)
  })
  fastify.get<{
    Params: {
      id: string
    }
  }>('/static/:id', async (request, reply) => {
    return reply.sendFile(request.params.id)
  })
  // Serve task attachments from subdirectory
  fastify.get<{
    Params: {
      id: string
    }
  }>('/static/tasks/:id', async (request, reply) => {
    return reply.sendFile(path.join('tasks', request.params.id))
  })
}
