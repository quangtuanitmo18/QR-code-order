import { dashboardIndicatorController } from '@/controllers/indicator.controller'
import { requireEmployeeHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  DashboardIndicatorQueryParams,
  DashboardIndicatorQueryParamsType,
  DashboardIndicatorRes,
  DashboardIndicatorResType
} from '@/schemaValidations/indicator.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function indicatorRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.addHook(
    'preValidation',
    fastify.auth([requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
      relation: 'and'
    })
  )
  fastify.get<{ Reply: DashboardIndicatorResType; Querystring: DashboardIndicatorQueryParamsType }>(
    '/dashboard',
    {
      schema: {
        response: {
          200: DashboardIndicatorRes
        },
        querystring: DashboardIndicatorQueryParams
      }
    },
    async (request, reply) => {
      const queryString = request.query
      const result = await dashboardIndicatorController(queryString)
      reply.send({
        message: 'Lấy các chỉ số thành công',
        data: result as DashboardIndicatorResType['data']
      })
    }
  )
}
