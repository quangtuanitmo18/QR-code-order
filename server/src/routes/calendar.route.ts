import {
  createEventController,
  deleteEventController,
  getEventByIdController,
  getEventDatesWithCountsController,
  getEventsController,
  updateEventController
} from '@/controllers/calendar.controller'
import {
  getNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController
} from '@/controllers/notification.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { RoleType } from '@/types/jwt.types'
import {
  CreateEventBody,
  CreateEventBodyType,
  CreateEventRes,
  CreateEventResType,
  DeleteEventRes,
  DeleteEventResType,
  EventIdParam,
  EventIdParamType,
  GetEventDatesWithCountsQueryParams,
  GetEventDatesWithCountsQueryParamsType,
  GetEventDatesWithCountsRes,
  GetEventDatesWithCountsResType,
  GetEventRes,
  GetEventResType,
  GetEventsQueryParams,
  GetEventsQueryParamsType,
  GetEventsRes,
  GetEventsResType,
  GetNotificationsQueryParams,
  GetNotificationsQueryParamsType,
  GetNotificationsRes,
  GetNotificationsResType,
  MarkNotificationReadRes,
  MarkNotificationReadResType,
  NotificationIdParam,
  NotificationIdParamType,
  UpdateEventBody,
  UpdateEventBodyType,
  UpdateEventRes,
  UpdateEventResType
} from '@/schemaValidations/calendar.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function calendarRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // All calendar routes require login
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook]))

  // GET /calendar/events - Get events (Owner sees all, Employee sees assigned + public)
  fastify.get<{ Reply: GetEventsResType; Querystring: GetEventsQueryParamsType }>(
    '/events',
    {
      schema: {
        response: {
          200: GetEventsRes
        },
        querystring: GetEventsQueryParams
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const userRole = request.decodedAccessToken?.role as RoleType
      const result = await getEventsController(userId, userRole, request.query)
      reply.send({
        message: 'Get events successfully',
        data: result
      })
    }
  )

  // GET /calendar/events/:id - Get single event by ID
  fastify.get<{ Reply: GetEventResType; Params: EventIdParamType }>(
    '/events/:id',
    {
      schema: {
        response: {
          200: GetEventRes
        },
        params: EventIdParam
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const userRole = request.decodedAccessToken?.role as RoleType
      const result = await getEventByIdController(request.params.id, userId, userRole)
      reply.send({
        message: 'Get event successfully',
        data: result
      })
    }
  )

  // POST /calendar/events - Create new event (Owner only)
  fastify.post<{ Reply: CreateEventResType; Body: CreateEventBodyType }>(
    '/events',
    {
      schema: {
        response: {
          200: CreateEventRes
        },
        body: CreateEventBody
      },
      preValidation: fastify.auth([requireOwnerHook])
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await createEventController(userId, request.body)
      reply.send({
        message: 'Create event successfully',
        data: result
      })
    }
  )

  // PUT /calendar/events/:id - Update event (Owner only, must be creator)
  fastify.put<{ Reply: UpdateEventResType; Params: EventIdParamType; Body: UpdateEventBodyType }>(
    '/events/:id',
    {
      schema: {
        response: {
          200: UpdateEventRes
        },
        params: EventIdParam,
        body: UpdateEventBody
      },
      preValidation: fastify.auth([requireOwnerHook])
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await updateEventController(request.params.id, userId, request.body)
      reply.send({
        message: 'Update event successfully',
        data: result
      })
    }
  )

  // DELETE /calendar/events/:id - Delete event (Owner only, must be creator)
  fastify.delete<{ Reply: DeleteEventResType; Params: EventIdParamType }>(
    '/events/:id',
    {
      schema: {
        response: {
          200: DeleteEventRes
        },
        params: EventIdParam
      },
      preValidation: fastify.auth([requireOwnerHook])
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await deleteEventController(request.params.id, userId)
      reply.send({
        message: result.message
      })
    }
  )

  // GET /calendar/event-dates - Get event dates with counts (for calendar picker)
  fastify.get<{ Reply: GetEventDatesWithCountsResType; Querystring: GetEventDatesWithCountsQueryParamsType }>(
    '/event-dates',
    {
      schema: {
        response: {
          200: GetEventDatesWithCountsRes
        },
        querystring: GetEventDatesWithCountsQueryParams
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const userRole = request.decodedAccessToken?.role as RoleType
      const startDate = new Date(request.query.startDate)
      const endDate = new Date(request.query.endDate)
      const result = await getEventDatesWithCountsController(userId, userRole, startDate, endDate)
      reply.send({
        message: 'Get event dates with counts successfully',
        data: result
      })
    }
  )

  // GET /calendar/notifications - Get notifications for authenticated user
  fastify.get<{ Reply: GetNotificationsResType; Querystring: GetNotificationsQueryParamsType }>(
    '/notifications',
    {
      schema: {
        response: {
          200: GetNotificationsRes
        },
        querystring: GetNotificationsQueryParams
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await getNotificationsController(userId, request.query)
      reply.send({
        message: 'Get notifications successfully',
        data: result
      })
    }
  )

  // PUT /calendar/notifications/:id/read - Mark notification as read
  fastify.put<{ Reply: MarkNotificationReadResType; Params: NotificationIdParamType }>(
    '/notifications/:id/read',
    {
      schema: {
        response: {
          200: MarkNotificationReadRes
        },
        params: NotificationIdParam
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await markNotificationAsReadController(request.params.id, userId)
      reply.send({
        message: 'Notification marked as read successfully',
        data: result
      })
    }
  )

  // PUT /calendar/notifications/read-all - Mark all notifications as read
  fastify.put<{ Reply: MarkNotificationReadResType }>(
    '/notifications/read-all',
    {
      schema: {
        response: {
          200: MarkNotificationReadRes
        }
      }
    },
    async (request, reply) => {
      const userId = request.decodedAccessToken?.userId as number
      const result = await markAllNotificationsAsReadController(userId)
      reply.send({
        message: 'All notifications marked as read successfully',
        data: result
      })
    }
  )
}
