import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { aiChatController } from '@/controllers/ai-chat.controller'

export default async function aiChatRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(aiChatController)
}
