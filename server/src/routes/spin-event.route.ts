import {
  createSpinEventController,
  deleteSpinEventController,
  getActiveSpinEventsController,
  getAllSpinEventsController,
  getSpinEventByIdController,
  toggleSpinEventActiveController,
  updateSpinEventController
} from '@/controllers/spin-event.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  CreateSpinEventBody,
  CreateSpinEventBodyType,
  CreateSpinEventRes,
  CreateSpinEventResType,
  DeleteSpinEventRes,
  DeleteSpinEventResType,
  GetActiveSpinEventsRes,
  GetActiveSpinEventsResType,
  GetSpinEventRes,
  GetSpinEventResType,
  GetSpinEventsQueryParams,
  GetSpinEventsQueryParamsType,
  GetSpinEventsRes,
  GetSpinEventsResType,
  SpinEventIdParam,
  SpinEventIdParamType,
  ToggleActiveRes,
  ToggleActiveResType,
  UpdateSpinEventBody,
  UpdateSpinEventBodyType,
  UpdateSpinEventRes,
  UpdateSpinEventResType
} from '@/schemaValidations/spin-event.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function spinEventRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // All routes require Owner role
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook, requireOwnerHook]))

  // Get all events
  fastify.get<{ Reply: GetSpinEventsResType; Querystring: GetSpinEventsQueryParamsType }>(
    '/',
    {
      schema: {
        response: {
          200: GetSpinEventsRes
        },
        querystring: GetSpinEventsQueryParams
      }
    },
    async (request, reply) => {
      const result = await getAllSpinEventsController(request.query)
      reply.send({
        message: 'Get spin events successfully',
        data: result as GetSpinEventsResType['data']
      })
    }
  )

  // Get active events
  fastify.get<{ Reply: GetActiveSpinEventsResType }>(
    '/active',
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

  // Get event by ID
  fastify.get<{ Reply: GetSpinEventResType; Params: SpinEventIdParamType }>(
    '/:id',
    {
      schema: {
        response: {
          200: GetSpinEventRes
        },
        params: SpinEventIdParam
      }
    },
    async (request, reply) => {
      const result = await getSpinEventByIdController(request.params.id)
      reply.send({
        message: 'Get spin event successfully',
        data: result as GetSpinEventResType['data']
      })
    }
  )

  // Create event
  fastify.post<{ Reply: CreateSpinEventResType; Body: CreateSpinEventBodyType }>(
    '/',
    {
      schema: {
        response: {
          201: CreateSpinEventRes
        },
        body: CreateSpinEventBody
      }
    },
    async (request, reply) => {
      const result = await createSpinEventController(request.decodedAccessToken?.userId as number, request.body)
      reply.status(201).send({
        message: 'Create spin event successfully',
        data: result as CreateSpinEventResType['data']
      })
    }
  )

  // Update event
  fastify.put<{
    Reply: UpdateSpinEventResType
    Params: SpinEventIdParamType
    Body: UpdateSpinEventBodyType
  }>(
    '/:id',
    {
      schema: {
        response: {
          200: UpdateSpinEventRes
        },
        params: SpinEventIdParam,
        body: UpdateSpinEventBody
      }
    },
    async (request, reply) => {
      const result = await updateSpinEventController(request.params.id, request.body)
      reply.send({
        message: 'Update spin event successfully',
        data: result as UpdateSpinEventResType['data']
      })
    }
  )

  // Delete event
  fastify.delete<{ Reply: DeleteSpinEventResType; Params: SpinEventIdParamType }>(
    '/:id',
    {
      schema: {
        response: {
          200: DeleteSpinEventRes
        },
        params: SpinEventIdParam
      }
    },
    async (request, reply) => {
      const result = await deleteSpinEventController(request.params.id)
      reply.send({
        message: 'Delete spin event successfully',
        data: result as DeleteSpinEventResType['data']
      })
    }
  )

  // Toggle active status
  fastify.put<{ Reply: ToggleActiveResType; Params: SpinEventIdParamType }>(
    '/:id/toggle-active',
    {
      schema: {
        response: {
          200: ToggleActiveRes
        },
        params: SpinEventIdParam
      }
    },
    async (request, reply) => {
      const result = await toggleSpinEventActiveController(request.params.id)
      reply.send({
        message: 'Toggle active status successfully',
        data: result as ToggleActiveResType['data']
      })
    }
  )
}
