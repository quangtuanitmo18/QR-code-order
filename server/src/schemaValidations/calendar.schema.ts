import { z } from 'zod'

// Event Types
export const EventType = {
  WORK_SHIFT: 'work_shift',
  MEETING: 'meeting',
  BIRTHDAY: 'birthday',
  HOLIDAY: 'holiday',
  COMPANY_EVENT: 'company_event',
  PERSONAL: 'personal'
} as const

export const EventTypeValues = [
  EventType.WORK_SHIFT,
  EventType.MEETING,
  EventType.BIRTHDAY,
  EventType.HOLIDAY,
  EventType.COMPANY_EVENT,
  EventType.PERSONAL
] as const

// Notification Types
export const NotificationType = {
  REMINDER: 'reminder',
  NEW_EVENT: 'new_event',
  UPDATED_EVENT: 'updated_event',
  CANCELLED_EVENT: 'cancelled_event'
} as const

// Recurring Rule Schema
export const RecurringRuleSchema = z
  .object({
    type: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().int().positive().default(1), // every N days/weeks/months
    dayOfWeek: z.number().int().min(0).max(6).optional(), // 0=Sunday, 1=Monday, etc. (for weekly)
    dayOfMonth: z.number().int().min(1).max(31).optional() // 1-31 (for monthly)
  })
  .refine(
    (data) => {
      if (data.type === 'weekly' && data.dayOfWeek === undefined) {
        return false
      }
      if (data.type === 'monthly' && data.dayOfMonth === undefined) {
        return false
      }
      return true
    },
    {
      message: 'dayOfWeek is required for weekly, dayOfMonth is required for monthly'
    }
  )

// Base Event Schema
const BaseEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  typeId: z.number().int().positive(), // CalendarType ID
  startDate: z.string().datetime(), // ISO date string
  endDate: z.string().datetime(), // ISO date string
  allDay: z.boolean().default(false),
  location: z.string().trim().max(200).optional(),
  color: z.string().trim().max(50).optional(), // e.g., "bg-blue-500"
  isRecurring: z.boolean().default(false),
  recurringRule: z.string().optional() // JSON string of RecurringRuleSchema
})

// Create Event Body
export const CreateEventBody = BaseEventSchema.extend({
  employeeIds: z.array(z.number().int().positive()).optional() // For work shifts - assign to employees
})
  .strict()
  .superRefine((data, ctx) => {
    // Validate startDate < endDate
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (startDate >= endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'startDate must be before endDate',
        path: ['endDate']
      })
    }

    // Note: work_shift validation will be done in service layer after fetching CalendarType

    // Validate recurring rule if isRecurring is true
    if (data.isRecurring) {
      if (!data.recurringRule) {
        ctx.addIssue({
          code: 'custom',
          message: 'recurringRule is required when isRecurring is true',
          path: ['recurringRule']
        })
      } else {
        try {
          const rule = JSON.parse(data.recurringRule)
          RecurringRuleSchema.parse(rule)
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? `Invalid recurringRule format: ${error.message}`
              : 'Invalid recurringRule format. Expected JSON with type, interval, and optional dayOfWeek/dayOfMonth'
          ctx.addIssue({
            code: 'custom',
            message: errorMessage,
            path: ['recurringRule']
          })
        }
      }
    }
  })

export type CreateEventBodyType = z.TypeOf<typeof CreateEventBody>

// Update Event Body (all fields optional except validation)
export const UpdateEventBody = BaseEventSchema.partial()
  .extend({
    employeeIds: z.array(z.number().int().positive()).optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    // If both startDate and endDate are provided, validate startDate < endDate
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      if (startDate >= endDate) {
        ctx.addIssue({
          code: 'custom',
          message: 'startDate must be before endDate',
          path: ['endDate']
        })
      }
    }

    // Note: work_shift validation will be done in service layer after fetching CalendarType

    // Validate recurring rule if isRecurring is true and recurringRule is provided
    if (data.isRecurring && data.recurringRule) {
      try {
        const rule = JSON.parse(data.recurringRule)
        RecurringRuleSchema.parse(rule)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? `Invalid recurringRule format: ${error.message}`
            : 'Invalid recurringRule format. Expected JSON with type, interval, and optional dayOfWeek/dayOfMonth'
        ctx.addIssue({
          code: 'custom',
          message: errorMessage,
          path: ['recurringRule']
        })
      }
    }
  })

export type UpdateEventBodyType = z.TypeOf<typeof UpdateEventBody>

// Get Events Query Parameters
export const GetEventsQueryParams = z
  .object({
    startDate: z.string().datetime(), // ISO date string
    endDate: z.string().datetime(), // ISO date string
    typeId: z.coerce.number().int().positive().optional(), // Filter by CalendarType ID
    employeeId: z.coerce.number().int().positive().optional() // For Owner to filter by employee
  })
  .strict()
  .superRefine((data, ctx) => {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (startDate >= endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'startDate must be before endDate',
        path: ['endDate']
      })
    }
  })

export type GetEventsQueryParamsType = z.TypeOf<typeof GetEventsQueryParams>

// Event ID Parameter
export const EventIdParam = z.object({
  id: z.coerce.number().int().positive()
})

export type EventIdParamType = z.TypeOf<typeof EventIdParam>

// Notification ID Parameter
export const NotificationIdParam = z.object({
  id: z.coerce.number().int().positive()
})

export type NotificationIdParamType = z.TypeOf<typeof NotificationIdParam>

// Get Event Dates with Counts Query Parameters
export const GetEventDatesWithCountsQueryParams = z
  .object({
    startDate: z.string().datetime(), // ISO date string
    endDate: z.string().datetime() // ISO date string
  })
  .strict()
  .superRefine((data, ctx) => {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (startDate >= endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'startDate must be before endDate',
        path: ['endDate']
      })
    }
  })

export type GetEventDatesWithCountsQueryParamsType = z.TypeOf<typeof GetEventDatesWithCountsQueryParams>

// Event Assignment Schema
export const EventAssignmentSchema = z.object({
  id: z.number(),
  employee: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string()
  })
})

// Event Response Schema
export const CalendarEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.object({
    id: z.number(),
    name: z.string(),
    label: z.string(),
    color: z.string(),
    category: z.string(),
    visible: z.boolean()
  }),
  typeId: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  allDay: z.boolean(),
  location: z.string().nullable(),
  color: z.string().nullable(),
  isRecurring: z.boolean(),
  recurringRule: z.string().nullable(),
  createdBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string()
  }),
  assignments: z.array(EventAssignmentSchema).optional(),
  occurrenceDate: z.date().optional(), // For recurring event occurrences
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CalendarEventType = z.TypeOf<typeof CalendarEventSchema>

// Event Dates with Counts (for calendar picker)
export const EventDateSchema = z.object({
  date: z.date(),
  count: z.number().int().nonnegative()
})

// Get Event Dates with Counts Response
export const GetEventDatesWithCountsRes = z.object({
  data: z.array(EventDateSchema),
  message: z.string()
})

export type GetEventDatesWithCountsResType = z.TypeOf<typeof GetEventDatesWithCountsRes>

// Get Events Response
export const GetEventsRes = z.object({
  data: z.array(CalendarEventSchema),
  message: z.string()
})

export type GetEventsResType = z.TypeOf<typeof GetEventsRes>

// Get Single Event Response
export const GetEventRes = z.object({
  data: CalendarEventSchema,
  message: z.string()
})

export type GetEventResType = z.TypeOf<typeof GetEventRes>

// Create/Update Event Response
export const CreateEventRes = z.object({
  data: CalendarEventSchema,
  message: z.string()
})

export type CreateEventResType = z.TypeOf<typeof CreateEventRes>

export const UpdateEventRes = CreateEventRes
export type UpdateEventResType = z.TypeOf<typeof UpdateEventRes>

// Delete Event Response
export const DeleteEventRes = z.object({
  message: z.string()
})

export type DeleteEventResType = z.TypeOf<typeof DeleteEventRes>

// Notification Schema
export const CalendarNotificationSchema = z.object({
  id: z.number(),
  eventId: z.number(),
  userId: z.number(),
  notificationType: z.string(),
  message: z.string(),
  scheduledFor: z.date(),
  isRead: z.boolean(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
  event: z
    .object({
      id: z.number(),
      title: z.string(),
      startDate: z.date(),
      endDate: z.date()
    })
    .optional()
})

export type CalendarNotificationType = z.TypeOf<typeof CalendarNotificationSchema>

// Get Notifications Query Parameters
export const GetNotificationsQueryParams = z.object({
  unreadOnly: z.coerce.boolean().optional().default(false)
})

export type GetNotificationsQueryParamsType = z.TypeOf<typeof GetNotificationsQueryParams>

// Get Notifications Response
export const GetNotificationsRes = z.object({
  data: z.object({
    notifications: z.array(CalendarNotificationSchema),
    unreadCount: z.number().int().nonnegative()
  }),
  message: z.string()
})

export type GetNotificationsResType = z.TypeOf<typeof GetNotificationsRes>

// Mark Notification as Read Response
export const MarkNotificationReadRes = z.object({
  data: z.object({
    success: z.boolean()
  }),
  message: z.string()
})

export type MarkNotificationReadResType = z.TypeOf<typeof MarkNotificationReadRes>
