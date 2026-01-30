import { Role } from '@/constants/type'
import { calendarRepository } from '@/repositories/calendar.repository'
import { notificationService } from '@/services/notification.service'
import { CreateEventBodyType, GetEventsQueryParamsType, UpdateEventBodyType } from '@/schemaValidations/calendar.schema'
import { RecurringRuleSchema } from '@/schemaValidations/calendar.schema'
import { RoleType } from '@/types/jwt.types'
import { EntityError } from '@/utils/errors'
import { addDays, addMonths, addWeeks } from 'date-fns'

// Recurring rule type
interface RecurringRule {
  type: 'daily' | 'weekly' | 'monthly'
  interval: number
  dayOfWeek?: number // 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number // 1-31
}

// Expanded event occurrence
interface ExpandedEventOccurrence {
  id: number
  title: string
  description: string | null
  typeId: number
  type: {
    id: number
    name: string
    label: string
    color: string
    category: string
    visible: boolean
  }
  startDate: Date
  endDate: Date
  allDay: boolean
  location: string | null
  color: string | null
  isRecurring: boolean
  recurringRule: string | null
  createdById: number
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: number
    name: string
    email: string
  }
  assignments: Array<{
    id: number
    eventId: number
    employeeId: number
    createdAt: Date
    employee: {
      id: number
      name: string
      email: string
    }
  }>
  occurrenceDate: Date // The actual occurrence date for this instance
}

/**
 * Expand recurring events into individual occurrences within a date range
 */
function expandRecurringEvents(
  events: Awaited<ReturnType<typeof calendarRepository.findEventsByDateRange>>,
  queryStartDate: Date,
  queryEndDate: Date
): ExpandedEventOccurrence[] {
  const expandedEvents: ExpandedEventOccurrence[] = []

  for (const event of events) {
    if (!event.isRecurring || !event.recurringRule) {
      // Non-recurring event: add as-is if it overlaps with query range
      // Event overlaps if: start <= queryEnd AND end >= queryStart
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      if (eventStart <= queryEndDate && eventEnd >= queryStartDate) {
        expandedEvents.push({
          ...event,
          occurrenceDate: new Date(event.startDate)
        })
      }
      continue
    }

    // Parse and validate recurring rule
    let rule: RecurringRule
    try {
      const parsed = JSON.parse(event.recurringRule)
      // Validate rule structure
      const validated = RecurringRuleSchema.parse(parsed)
      rule = validated as RecurringRule
    } catch {
      // Invalid rule, skip this event
      continue
    }

    const baseStartDate = new Date(event.startDate)
    const baseEndDate = new Date(event.endDate)
    const duration = baseEndDate.getTime() - baseStartDate.getTime()

    // Generate occurrences
    let currentDate = new Date(baseStartDate)
    const maxOccurrences = 1000 // Safety limit to prevent infinite loops
    let occurrenceCount = 0

    // Start from queryStartDate if base event starts before it (for recurring events)
    if (currentDate < queryStartDate) {
      // Fast-forward to first occurrence within query range
      // This is a simplified approach - for production, consider more sophisticated date math
      const daysDiff = Math.ceil((queryStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      switch (rule.type) {
        case 'daily':
          currentDate = addDays(currentDate, Math.floor(daysDiff / rule.interval) * rule.interval)
          break
        case 'weekly':
          // For weekly, we need to find the next occurrence
          // This is handled in the switch below, so we'll let the loop handle it
          break
        case 'monthly':
          // For monthly, approximate
          const monthsDiff = Math.floor(daysDiff / 30)
          currentDate = addMonths(currentDate, Math.floor(monthsDiff / rule.interval) * rule.interval)
          break
      }
    }

    while (currentDate <= queryEndDate && occurrenceCount < maxOccurrences) {
      // Check if this occurrence overlaps with query range
      const occurrenceEndDate = new Date(currentDate.getTime() + duration)

      // Event overlaps if: start <= queryEnd AND end >= queryStart
      if (currentDate <= queryEndDate && occurrenceEndDate >= queryStartDate) {
        expandedEvents.push({
          ...event,
          startDate: currentDate,
          endDate: occurrenceEndDate,
          occurrenceDate: currentDate
        })
      }

      // Calculate next occurrence
      switch (rule.type) {
        case 'daily':
          currentDate = addDays(currentDate, rule.interval)
          break
        case 'weekly':
          if (rule.dayOfWeek !== undefined) {
            // Find next occurrence of the specified day of week
            const currentDayOfWeek = currentDate.getDay()
            let daysUntilNext = (rule.dayOfWeek - currentDayOfWeek + 7) % 7
            // If already on the target day, move to next week
            if (daysUntilNext === 0) {
              daysUntilNext = rule.interval * 7
            }
            currentDate = addDays(currentDate, daysUntilNext)
          } else {
            currentDate = addWeeks(currentDate, rule.interval)
          }
          break
        case 'monthly':
          if (rule.dayOfMonth !== undefined) {
            // Find next occurrence of the specified day of month
            currentDate = addMonths(currentDate, rule.interval)
            // Set to the specified day of month
            const targetDay = Math.min(
              rule.dayOfMonth,
              new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
            )
            currentDate.setDate(targetDay)
          } else {
            currentDate = addMonths(currentDate, rule.interval)
          }
          break
      }

      occurrenceCount++
    }
  }

  return expandedEvents
}

export const calendarService = {
  /**
   * Get events for a user based on their role
   * - Owner: sees all events
   * - Employee: sees assigned events + public events
   */
  async getEvents(userId: number, userRole: RoleType, query: GetEventsQueryParamsType) {
    const startDate = new Date(query.startDate)
    const endDate = new Date(query.endDate)

    let events

    if (userRole === Role.Owner) {
      // Owner sees all events
      events = await calendarRepository.findEventsByDateRange(startDate, endDate, {
        typeId: query.typeId
      })
    } else {
      // Employee sees: assigned events + public events
      const [assignedEvents, publicEvents] = await Promise.all([
        calendarRepository.findEventsByEmployee(userId, startDate, endDate),
        calendarRepository.findPublicEvents(startDate, endDate)
      ])

      // Combine and deduplicate by event ID
      const eventMap = new Map<number, (typeof assignedEvents)[0]>()
      assignedEvents.forEach((event) => eventMap.set(event.id, event))
      publicEvents.forEach((event) => {
        if (!eventMap.has(event.id)) {
          eventMap.set(event.id, event)
        }
      })

      events = Array.from(eventMap.values())

      // Filter by typeId if specified
      if (query.typeId) {
        events = events.filter((event) => event.typeId === query.typeId)
      }
    }

    // Expand recurring events
    const expandedEvents = expandRecurringEvents(events, startDate, endDate)

    // Sort by start date
    expandedEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    // Return events directly (serializerCompiler will handle Date serialization)
    return expandedEvents
  },

  /**
   * Get single event by ID (with role-based access check)
   * @throws {EntityError} if event not found or access denied
   */
  async getEventById(eventId: number, userId: number, userRole: RoleType) {
    const event = await calendarRepository.findEventById(eventId)

    // Check access: Owner can see all, Employee can only see if assigned or public
    if (userRole !== Role.Owner) {
      const isAssigned = event.assignments.some((assignment) => assignment.employeeId === userId)
      const isPublic = event.assignments.length === 0

      if (!isAssigned && !isPublic) {
        throw new EntityError([{ field: 'id', message: 'Event not found or access denied' }])
      }
    }

    // Return event directly (serializerCompiler will handle Date serialization)
    return event
  },

  /**
   * Create new event (Owner only)
   * @throws {EntityError} if validation fails
   */
  async createEvent(userId: number, body: CreateEventBodyType) {
    const eventData = {
      title: body.title,
      description: body.description || null,
      typeId: body.typeId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      allDay: body.allDay,
      location: body.location || null,
      color: body.color || null,
      isRecurring: body.isRecurring,
      // recurringRule is already a JSON string from schema validation
      recurringRule: body.recurringRule || null,
      createdById: userId
    }

    // Create event
    const event = await calendarRepository.createEvent(eventData)

    // Assign employees if provided
    if (body.employeeIds && body.employeeIds.length > 0) {
      await calendarRepository.assignEmployeesToEvent(event.id, body.employeeIds)
      // Fetch updated event with assignments
      const updatedEvent = await calendarRepository.findEventById(event.id)

      // Create notifications for assigned employees
      try {
        await notificationService.createEventCreatedNotifications(event.id, body.employeeIds)
      } catch (error) {
        // Log error but don't fail event creation
        console.error('[Calendar Service] Failed to create notifications:', error)
      }

      // Return event directly (serializerCompiler will handle Date serialization)
      return updatedEvent
    }

    // Return event directly (serializerCompiler will handle Date serialization)
    return event
  },

  /**
   * Update event (Owner only, must be creator)
   * @throws {EntityError} if event not found, access denied, or validation fails
   */
  async updateEvent(eventId: number, userId: number, body: UpdateEventBodyType) {
    // Check if event exists and user is creator
    // findEventById throws if event not found
    const existingEvent = await calendarRepository.findEventById(eventId)
    if (existingEvent.createdById !== userId) {
      throw new EntityError([{ field: 'id', message: 'Only the event creator can update this event' }])
    }

    // Prepare update data
    const updateData: Parameters<typeof calendarRepository.updateEvent>[1] = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.typeId !== undefined) updateData.typeId = body.typeId
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    if (body.allDay !== undefined) updateData.allDay = body.allDay
    if (body.location !== undefined) updateData.location = body.location || null
    if (body.color !== undefined) updateData.color = body.color
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring
    if (body.recurringRule !== undefined) {
      // recurringRule is already a JSON string from schema validation
      updateData.recurringRule = body.recurringRule || null
    }

    // Update event
    const updatedEvent = await calendarRepository.updateEvent(eventId, updateData)

    // Handle employee assignments
    if (body.employeeIds !== undefined) {
      let assignedUserIds: number[] = []

      if (body.employeeIds.length === 0) {
        // Remove all assignments (make event public)
        await calendarRepository.removeAllAssignmentsFromEvent(eventId)
      } else {
        // Replace all assignments
        // First remove all, then add new ones
        await calendarRepository.removeAllAssignmentsFromEvent(eventId)
        await calendarRepository.assignEmployeesToEvent(eventId, body.employeeIds)
        assignedUserIds = body.employeeIds
      }

      // Fetch updated event with assignments
      const finalEvent = await calendarRepository.findEventById(eventId)

      // Create notifications for assigned employees if event was updated
      if (assignedUserIds.length > 0) {
        try {
          await notificationService.createEventUpdatedNotifications(eventId, assignedUserIds)
        } catch (error) {
          // Log error but don't fail event update
          console.error('[Calendar Service] Failed to create update notifications:', error)
        }
      }

      // Return event directly (serializerCompiler will handle Date serialization)
      return finalEvent
    }

    // Return event directly (serializerCompiler will handle Date serialization)
    return updatedEvent
  },

  /**
   * Delete event (Owner only, must be creator)
   * @throws {EntityError} if event not found or access denied
   */
  async deleteEvent(eventId: number, userId: number) {
    // Check if event exists and user is creator
    // findEventById throws if event not found
    const existingEvent = await calendarRepository.findEventById(eventId)
    if (existingEvent.createdById !== userId) {
      throw new EntityError([{ field: 'id', message: 'Only the event creator can delete this event' }])
    }

    // Get assigned user IDs and event title before deleting
    const assignedUserIds = existingEvent.assignments.map((assignment) => assignment.employeeId)
    const eventTitle = existingEvent.title

    // Delete event (cascades to assignments and notifications)
    await calendarRepository.deleteEvent(eventId)

    // Create cancellation notifications for assigned employees
    // Pass event title since event is already deleted
    if (assignedUserIds.length > 0) {
      try {
        await notificationService.createEventCancelledNotifications(eventId, assignedUserIds, eventTitle)
      } catch (error) {
        // Log error but don't fail event deletion
        // Note: Event is already deleted, so we can't fetch it again
        console.error('[Calendar Service] Failed to create cancellation notifications:', error)
      }
    }

    return { message: 'Event deleted successfully' }
  },

  /**
   * Get event dates with counts (for calendar picker)
   * Owner sees all, Employee sees assigned + public
   * Note: Recurring events are not expanded for counts (only base date counted)
   */
  async getEventDatesWithCounts(userId: number, userRole: RoleType, startDate: Date, endDate: Date) {
    if (userRole === Role.Owner) {
      return await calendarRepository.getEventDatesWithCounts(startDate, endDate)
    }

    // Employee: get assigned events + public events
    const [assignedEvents, publicEvents] = await Promise.all([
      calendarRepository.findEventsByEmployee(userId, startDate, endDate),
      calendarRepository.findPublicEvents(startDate, endDate)
    ])

    // Combine and deduplicate
    const eventMap = new Map<number, (typeof assignedEvents)[0]>()
    assignedEvents.forEach((event) => eventMap.set(event.id, event))
    publicEvents.forEach((event) => {
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, event)
      }
    })

    const events = Array.from(eventMap.values())

    // Count events per day (simplified - doesn't expand recurring events for counts)
    const dateCounts = new Map<string, number>()

    events.forEach((event) => {
      if (event.isRecurring && event.recurringRule) {
        // For recurring events, count only base date
        const eventDate = new Date(event.startDate)
        const dateKey = eventDate.toISOString().split('T')[0]
        dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1)
      } else {
        // For non-recurring events, count each day
        const start = new Date(event.startDate)
        const end = new Date(event.endDate)
        const currentDate = new Date(start)
        while (currentDate <= end) {
          const dateKey = currentDate.toISOString().split('T')[0]
          dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1)
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })

    return Array.from(dateCounts.entries()).map(([date, count]) => ({
      date: new Date(date),
      count
    }))
  }
}
