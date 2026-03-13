import { adminAiChatController } from '@/controllers/admin-ai-chat.controller'
import { aiChatController } from '@/controllers/ai-chat.controller'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function aiChatRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(aiChatController)
  fastify.register(adminAiChatController, { prefix: '/admin' })
}
