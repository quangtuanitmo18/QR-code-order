import {
  createSpinRewardController,
  deleteSpinRewardController,
  getSpinRewardByIdController,
  getSpinRewardsController,
  reorderRewardsController,
  updateSpinRewardController,
  validateProbabilitiesController
} from '@/controllers/spin-reward.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  CreateSpinRewardBody,
  CreateSpinRewardBodyType,
  CreateSpinRewardRes,
  CreateSpinRewardResType,
  DeleteSpinRewardRes,
  DeleteSpinRewardResType,
  GetSpinRewardRes,
  GetSpinRewardResType,
  GetSpinRewardsQueryParams,
  GetSpinRewardsQueryParamsType,
  GetSpinRewardsRes,
  GetSpinRewardsResType,
  ReorderRewardsBody,
  ReorderRewardsBodyType,
  ReorderRewardsRes,
  ReorderRewardsResType,
  SpinRewardIdParam,
  SpinRewardIdParamType,
  UpdateSpinRewardBody,
  UpdateSpinRewardBodyType,
  UpdateSpinRewardRes,
  UpdateSpinRewardResType
} from '@/schemaValidations/spin-reward.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function spinRewardRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // All routes require Owner role
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook, requireOwnerHook]))

  // Get all rewards
  fastify.get<{ Reply: GetSpinRewardsResType; Querystring: GetSpinRewardsQueryParamsType }>(
    '/',
    {
      schema: {
        response: {
          200: GetSpinRewardsRes
        },
        querystring: GetSpinRewardsQueryParams
      }
    },
    async (request, reply) => {
      const result = await getSpinRewardsController(request.query)
      reply.send({
        message: 'Get spin rewards successfully',
        data: result as GetSpinRewardsResType['data']
      })
    }
  )

  // Get reward by ID
  fastify.get<{ Reply: GetSpinRewardResType; Params: SpinRewardIdParamType }>(
    '/:id',
    {
      schema: {
        response: {
          200: GetSpinRewardRes
        },
        params: SpinRewardIdParam
      }
    },
    async (request, reply) => {
      const result = await getSpinRewardByIdController(request.params.id)
      reply.send({
        message: 'Get spin reward successfully',
        data: result as GetSpinRewardResType['data']
      })
    }
  )

  // Create reward
  fastify.post<{ Reply: CreateSpinRewardResType; Body: CreateSpinRewardBodyType }>(
    '/',
    {
      schema: {
        response: {
          200: CreateSpinRewardRes
        },
        body: CreateSpinRewardBody
      }
    },
    async (request, reply) => {
      const result = await createSpinRewardController(request.body)
      reply.send({
        message: 'Create spin reward successfully',
        data: result as CreateSpinRewardResType['data']
      })
    }
  )

  // Update reward
  fastify.put<{
    Reply: UpdateSpinRewardResType
    Params: SpinRewardIdParamType
    Body: UpdateSpinRewardBodyType
  }>(
    '/:id',
    {
      schema: {
        response: {
          200: UpdateSpinRewardRes
        },
        params: SpinRewardIdParam,
        body: UpdateSpinRewardBody
      }
    },
    async (request, reply) => {
      const result = await updateSpinRewardController(request.params.id, request.body)
      reply.send({
        message: 'Update spin reward successfully',
        data: result as UpdateSpinRewardResType['data']
      })
    }
  )

  // Delete reward (soft delete)
  fastify.delete<{ Reply: DeleteSpinRewardResType; Params: SpinRewardIdParamType }>(
    '/:id',
    {
      schema: {
        response: {
          200: DeleteSpinRewardRes
        },
        params: SpinRewardIdParam
      }
    },
    async (request, reply) => {
      const result = await deleteSpinRewardController(request.params.id)
      reply.send({
        message: 'Delete spin reward successfully',
        data: result as DeleteSpinRewardResType['data']
      })
    }
  )

  // Reorder rewards
  fastify.post<{ Reply: ReorderRewardsResType; Body: ReorderRewardsBodyType }>(
    '/reorder',
    {
      schema: {
        response: {
          200: ReorderRewardsRes
        },
        body: ReorderRewardsBody
      }
    },
    async (request, reply) => {
      const result = await reorderRewardsController(request.body)
      reply.send({
        message: 'Reorder rewards successfully'
      } as ReorderRewardsResType)
    }
  )

  // Validate probabilities (optional helper endpoint)
  fastify.get(
    '/validate-probabilities',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              isValid: { type: 'boolean' },
              total: { type: 'number' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const result = await validateProbabilitiesController()
      reply.send({
        message: 'Validate probabilities successfully',
        ...result
      })
    }
  )
}
