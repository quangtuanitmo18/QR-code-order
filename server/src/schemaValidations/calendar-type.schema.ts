import { z } from 'zod'

// Calendar Type Schema
export const CalendarTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  label: z.string(),
  color: z.string(),
  category: z.string(), // "personal", "work", "shared"
  visible: z.boolean(),
  createdBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string()
  }),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string() // ISO date string
})

export type CalendarTypeType = z.TypeOf<typeof CalendarTypeSchema>

// Get Calendar Types Query Parameters
export const GetCalendarTypesQueryParams = z.object({
  visible: z.coerce.boolean().optional(),
  category: z.string().optional()
})

export type GetCalendarTypesQueryParamsType = z.TypeOf<typeof GetCalendarTypesQueryParams>

// Get Calendar Types Response
export const GetCalendarTypesRes = z.object({
  data: z.array(CalendarTypeSchema),
  message: z.string()
})

export type GetCalendarTypesResType = z.TypeOf<typeof GetCalendarTypesRes>

// Get Calendar Type by ID Response
export const GetCalendarTypeRes = z.object({
  data: CalendarTypeSchema,
  message: z.string()
})

export type GetCalendarTypeResType = z.TypeOf<typeof GetCalendarTypeRes>

// Create Calendar Type Body
export const CreateCalendarTypeBody = z
  .object({
    name: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9_]+$/, 'Name must be lowercase alphanumeric with underscores'),
    label: z.string().min(1).max(100),
    color: z.string().regex(/^bg-\w+-\d+$/, 'Color must be a valid Tailwind color class'),
    category: z.enum(['personal', 'work', 'shared']),
    visible: z.boolean().optional().default(true)
  })
  .strict()

export type CreateCalendarTypeBodyType = z.TypeOf<typeof CreateCalendarTypeBody>

// Create Calendar Type Response
export const CreateCalendarTypeRes = z.object({
  data: CalendarTypeSchema,
  message: z.string()
})

export type CreateCalendarTypeResType = z.TypeOf<typeof CreateCalendarTypeRes>

// Update Calendar Type Body
export const UpdateCalendarTypeBody = z
  .object({
    label: z.string().min(1).max(100).optional(),
    color: z
      .string()
      .regex(/^bg-\w+-\d+$/, 'Color must be a valid Tailwind color class')
      .optional(),
    category: z.enum(['personal', 'work', 'shared']).optional(),
    visible: z.boolean().optional()
  })
  .strict()

export type UpdateCalendarTypeBodyType = z.TypeOf<typeof UpdateCalendarTypeBody>

// Update Calendar Type Response
export const UpdateCalendarTypeRes = z.object({
  data: CalendarTypeSchema,
  message: z.string()
})

export type UpdateCalendarTypeResType = z.TypeOf<typeof UpdateCalendarTypeRes>

// Delete Calendar Type Response
export const DeleteCalendarTypeRes = z.object({
  data: z.object({
    success: z.boolean()
  }),
  message: z.string()
})

export type DeleteCalendarTypeResType = z.TypeOf<typeof DeleteCalendarTypeRes>

// Toggle Visibility Response
export const ToggleVisibilityRes = z.object({
  data: CalendarTypeSchema,
  message: z.string()
})

export type ToggleVisibilityResType = z.TypeOf<typeof ToggleVisibilityRes>

// Calendar Type ID Param
export const CalendarTypeIdParam = z.object({
  id: z.coerce.number()
})

export type CalendarTypeIdParamType = z.TypeOf<typeof CalendarTypeIdParam>
