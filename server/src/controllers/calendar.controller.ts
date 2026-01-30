import { RoleType } from '@/types/jwt.types'
import { CreateEventBodyType, GetEventsQueryParamsType, UpdateEventBodyType } from '@/schemaValidations/calendar.schema'
import { calendarService } from '@/services/calendar.service'

/**
 * Get events for the authenticated user
 * - Owner: sees all events
 * - Employee: sees assigned events + public events
 */
export const getEventsController = async (userId: number, userRole: RoleType, query: GetEventsQueryParamsType) => {
  return await calendarService.getEvents(userId, userRole, query)
}

/**
 * Get single event by ID (with role-based access check)
 */
export const getEventByIdController = async (eventId: number, userId: number, userRole: RoleType) => {
  return await calendarService.getEventById(eventId, userId, userRole)
}

/**
 * Create new event (Owner only)
 */
export const createEventController = async (userId: number, body: CreateEventBodyType) => {
  return await calendarService.createEvent(userId, body)
}

/**
 * Update event (Owner only, must be creator)
 */
export const updateEventController = async (eventId: number, userId: number, body: UpdateEventBodyType) => {
  return await calendarService.updateEvent(eventId, userId, body)
}

/**
 * Delete event (Owner only, must be creator)
 */
export const deleteEventController = async (eventId: number, userId: number) => {
  return await calendarService.deleteEvent(eventId, userId)
}

/**
 * Get event dates with counts (for calendar picker)
 * Owner sees all, Employee sees assigned + public
 */
export const getEventDatesWithCountsController = async (
  userId: number,
  userRole: RoleType,
  startDate: Date,
  endDate: Date
) => {
  return await calendarService.getEventDatesWithCounts(userId, userRole, startDate, endDate)
}
