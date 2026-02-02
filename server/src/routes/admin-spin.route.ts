import {
  getAllSpinsController,
  getStatisticsController,
  grantSpinController,
  updateSpinController
} from '@/controllers/admin-spin.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  EmployeeSpinIdParam,
  EmployeeSpinIdParamType,
  GetAllSpinsQueryParams,
  GetAllSpinsQueryParamsType,
  GetAllSpinsRes,
  GetAllSpinsResType,
  GrantSpinBody,
  GrantSpinBodyType,
  GrantSpinRes,
  GrantSpinResType,
  UpdateSpinBody,
  UpdateSpinBodyType,
  UpdateSpinRes,
  UpdateSpinResType
} from '@/schemaValidations/employee-spin.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function adminSpinRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // All routes require Owner role
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook, requireOwnerHook]))

  // Get all spins (admin view with filters and pagination)
  fastify.get<{ Reply: GetAllSpinsResType; Querystring: GetAllSpinsQueryParamsType }>(
    '/',
    {
      schema: {
        response: {
          200: GetAllSpinsRes
        },
        querystring: GetAllSpinsQueryParams
      }
    },
    async (request, reply) => {
      const result = await getAllSpinsController(request.query)
      reply.send({
        message: 'Get all spins successfully',
        data: result as GetAllSpinsResType['data']
      })
    }
  )

  // Grant spin to employee
  fastify.post<{ Reply: GrantSpinResType; Body: GrantSpinBodyType }>(
    '/grant',
    {
      schema: {
        response: {
          200: GrantSpinRes
        },
        body: GrantSpinBody
      }
    },
    async (request, reply) => {
      const adminId = request.decodedAccessToken?.userId as number
      const result = await grantSpinController(adminId, request.body)
      reply.send({
        message: 'Grant spin successfully',
        data: result as GrantSpinResType['data']
      })
    }
  )

  // Update spin (admin override)
  fastify.put<{
    Reply: UpdateSpinResType
    Params: EmployeeSpinIdParamType
    Body: UpdateSpinBodyType
  }>(
    '/:spinId',
    {
      schema: {
        response: {
          200: UpdateSpinRes
        },
        params: EmployeeSpinIdParam,
        body: UpdateSpinBody
      }
    },
    async (request, reply) => {
      const result = await updateSpinController(request.params, request.body)
      reply.send({
        message: 'Update spin successfully',
        data: result as UpdateSpinResType['data']
      })
    }
  )

  // Get statistics (optional, placeholder)
  fastify.get(
    '/statistics',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              totalSpins: { type: 'number' },
              totalRewards: { type: 'number' },
              claimRate: { type: 'number' },
              topRewards: { type: 'array' },
              topEmployees: { type: 'array' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const result = await getStatisticsController()
      reply.send({
        message: 'Get statistics successfully',
        ...result
      })
    }
  )
}
