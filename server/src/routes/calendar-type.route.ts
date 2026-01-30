import {
  createCalendarTypeController,
  deleteCalendarTypeController,
  getCalendarTypeByIdController,
  getCalendarTypesController,
  toggleVisibilityController,
  updateCalendarTypeController
} from '@/controllers/calendar-type.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  CalendarTypeIdParam,
  CalendarTypeIdParamType,
  CreateCalendarTypeBody,
  CreateCalendarTypeBodyType,
  CreateCalendarTypeRes,
  CreateCalendarTypeResType,
  DeleteCalendarTypeRes,
  DeleteCalendarTypeResType,
  GetCalendarTypeRes,
  GetCalendarTypeResType,
  GetCalendarTypesQueryParams,
  GetCalendarTypesQueryParamsType,
  GetCalendarTypesRes,
  GetCalendarTypesResType,
  ToggleVisibilityRes,
  ToggleVisibilityResType,
  UpdateCalendarTypeBody,
  UpdateCalendarTypeBodyType,
  UpdateCalendarTypeRes,
  UpdateCalendarTypeResType
} from '@/schemaValidations/calendar-type.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function calendarTypeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get all calendar types (public for all logged in users)
  fastify.addHook('preValidation', requireLoginedHook)

  fastify.get<{ Reply: GetCalendarTypesResType; Querystring: GetCalendarTypesQueryParamsType }>(
    '/',
    {
      schema: {
        response: {
          200: GetCalendarTypesRes
        },
        querystring: GetCalendarTypesQueryParams
      }
    },
    async (request, reply) => {
      const result = await getCalendarTypesController(request.query)
      reply.send({
        message: 'Get calendar types successfully',
        data: result as GetCalendarTypesResType['data']
      })
    }
  )

  // Get calendar type by ID
  fastify.get<{ Reply: GetCalendarTypeResType; Params: CalendarTypeIdParamType }>(
    '/:id',
    {
      schema: {
        response: {
          200: GetCalendarTypeRes
        },
        params: CalendarTypeIdParam
      }
    },
    async (request, reply) => {
      const result = await getCalendarTypeByIdController(request.params.id)
      reply.send({
        message: 'Get calendar type successfully',
        data: result as GetCalendarTypeResType['data']
      })
    }
  )

  // Create, update, delete - only for Owner
  fastify.addHook('preValidation', requireOwnerHook)

  // Create calendar type
  fastify.post<{ Reply: CreateCalendarTypeResType; Body: CreateCalendarTypeBodyType }>(
    '/',
    {
      schema: {
        response: {
          200: CreateCalendarTypeRes
        },
        body: CreateCalendarTypeBody
      }
    },
    async (request, reply) => {
      const result = await createCalendarTypeController(request.decodedAccessToken?.userId as number, request.body)
      reply.send({
        message: 'Create calendar type successfully',
        data: result as CreateCalendarTypeResType['data']
      })
    }
  )

  // Update calendar type
  fastify.put<{
    Reply: UpdateCalendarTypeResType
    Params: CalendarTypeIdParamType
    Body: UpdateCalendarTypeBodyType
  }>(
    '/:id',
    {
      schema: {
        response: {
          200: UpdateCalendarTypeRes
        },
        params: CalendarTypeIdParam,
        body: UpdateCalendarTypeBody
      }
    },
    async (request, reply) => {
      const result = await updateCalendarTypeController(request.params.id, request.body)
      reply.send({
        message: 'Update calendar type successfully',
        data: result as UpdateCalendarTypeResType['data']
      })
    }
  )

  // Delete calendar type
  fastify.delete<{ Reply: DeleteCalendarTypeResType; Params: CalendarTypeIdParamType }>(
    '/:id',
    {
      schema: {
        response: {
          200: DeleteCalendarTypeRes
        },
        params: CalendarTypeIdParam
      }
    },
    async (request, reply) => {
      const result = await deleteCalendarTypeController(request.params.id)
      reply.send({
        message: 'Delete calendar type successfully',
        data: result as DeleteCalendarTypeResType['data']
      })
    }
  )

  // Toggle visibility
  fastify.put<{ Reply: ToggleVisibilityResType; Params: CalendarTypeIdParamType }>(
    '/:id/toggle-visibility',
    {
      schema: {
        response: {
          200: ToggleVisibilityRes
        },
        params: CalendarTypeIdParam
      }
    },
    async (request, reply) => {
      const result = await toggleVisibilityController(request.params.id)
      reply.send({
        message: 'Toggle visibility successfully',
        data: result as ToggleVisibilityResType['data']
      })
    }
  )
}
