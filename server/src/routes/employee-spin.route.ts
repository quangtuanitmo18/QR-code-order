import {
  claimRewardController,
  executeSpinController,
  getActiveRewardsController,
  getMySpinsController,
  getPendingRewardsController
} from '@/controllers/employee-spin.controller'
import { getActiveSpinEventsController } from '@/controllers/spin-event.controller'
import { requireEmployeeHook, requireLoginedHook } from '@/hooks/auth.hooks'
import {
  ClaimRewardRes,
  ClaimRewardResType,
  EmployeeSpinIdParam,
  EmployeeSpinIdParamType,
  ExecuteSpinBody,
  ExecuteSpinBodyType,
  ExecuteSpinRes,
  ExecuteSpinResType,
  GetActiveRewardsRes,
  GetActiveRewardsResType,
  GetEmployeeSpinsQueryParams,
  GetEmployeeSpinsQueryParamsType,
  GetEmployeeSpinsRes,
  GetEmployeeSpinsResType,
  GetPendingRewardsRes,
  GetPendingRewardsResType
} from '@/schemaValidations/employee-spin.schema'
import { GetActiveSpinEventsRes, GetActiveSpinEventsResType } from '@/schemaValidations/spin-event.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function employeeSpinRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // All routes require Employee role
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook, requireEmployeeHook]))

  // Get active events (for display)
  fastify.get<{ Reply: GetActiveSpinEventsResType }>(
    '/events',
    {
      schema: {
        response: {
          200: GetActiveSpinEventsRes
        }
      }
    },
    async (request, reply) => {
      const result = await getActiveSpinEventsController()
      reply.send({
        message: 'Get active spin events successfully',
        data: result as GetActiveSpinEventsResType['data']
      })
    }
  )

  // Get active rewards (for spin wheel display)
  fastify.get<{ Reply: GetActiveRewardsResType }>(
    '/rewards',
    {
      schema: {
        response: {
          200: GetActiveRewardsRes
        }
      }
    },
    async (request, reply) => {
      const result = await getActiveRewardsController()
      reply.send({
        message: 'Get active rewards successfully',
        data: result as GetActiveRewardsResType['data']
      })
    }
  )

  // Get employee's spin history
  fastify.get<{ Reply: GetEmployeeSpinsResType; Querystring: GetEmployeeSpinsQueryParamsType }>(
    '/my-spins',
    {
      schema: {
        response: {
          200: GetEmployeeSpinsRes
        },
        querystring: GetEmployeeSpinsQueryParams
      }
    },
    async (request, reply) => {
      const employeeId = request.decodedAccessToken?.userId as number
      const result = await getMySpinsController(employeeId, request.query)
      reply.send({
        message: 'Get my spins successfully',
        data: result as GetEmployeeSpinsResType['data']
      })
    }
  )

  // Get pending rewards (unclaimed)
  fastify.get<{ Reply: GetPendingRewardsResType }>(
    '/pending',
    {
      schema: {
        response: {
          200: GetPendingRewardsRes
        }
      }
    },
    async (request, reply) => {
      const employeeId = request.decodedAccessToken?.userId as number
      const result = await getPendingRewardsController(employeeId)
      reply.send({
        message: 'Get pending rewards successfully',
        data: result as GetPendingRewardsResType['data']
      })
    }
  )

  // Execute spin
  fastify.post<{ Reply: ExecuteSpinResType; Body: ExecuteSpinBodyType }>(
    '/spin',
    {
      schema: {
        response: {
          200: ExecuteSpinRes
        },
        body: ExecuteSpinBody
      }
    },
    async (request, reply) => {
      const employeeId = request.decodedAccessToken?.userId as number
      const result = await executeSpinController(employeeId, request.body, fastify)
      reply.send({
        message: 'Spin executed successfully',
        data: result as ExecuteSpinResType['data']
      })
    }
  )

  // Claim reward
  fastify.post<{ Reply: ClaimRewardResType; Params: EmployeeSpinIdParamType }>(
    '/claim/:spinId',
    {
      schema: {
        response: {
          200: ClaimRewardRes
        },
        params: EmployeeSpinIdParam
      }
    },
    async (request, reply) => {
      const employeeId = request.decodedAccessToken?.userId as number
      const result = await claimRewardController(employeeId, request.params)
      reply.send({
        message: 'Reward claimed successfully',
        data: result as ClaimRewardResType['data']
      })
    }
  )
}
