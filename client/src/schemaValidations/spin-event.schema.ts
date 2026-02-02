import { z } from 'zod'

// SpinEvent Schema (for responses - dates as ISO strings)
export const SpinEventSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  startDate: z.string(), // ISO date string
  endDate: z.string().nullable(), // ISO date string
  isActive: z.boolean(),
  createdById: z.number(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  createdBy: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
  _count: z
    .object({
      rewards: z.number(),
      spins: z.number(),
    })
    .optional(),
})

export type SpinEventType = z.TypeOf<typeof SpinEventSchema>

// Get Spin Events Query Parameters
export const GetSpinEventsQueryParams = z.object({
  isActive: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export type GetSpinEventsQueryParamsType = z.TypeOf<typeof GetSpinEventsQueryParams>

// Get Spin Events Response
export const GetSpinEventsRes = z.object({
  data: z.array(SpinEventSchema),
  message: z.string(),
})

export type GetSpinEventsResType = z.TypeOf<typeof GetSpinEventsRes>

// Get Active Spin Events Response
export const GetActiveSpinEventsRes = z.object({
  data: z.array(SpinEventSchema),
  message: z.string(),
})

export type GetActiveSpinEventsResType = z.TypeOf<typeof GetActiveSpinEventsRes>

// Get Spin Event by ID Response
export const GetSpinEventRes = z.object({
  data: SpinEventSchema.extend({
    rewards: z
      .array(
        z.object({
          id: z.number(),
          name: z.string(),
          description: z.string().nullable(),
          type: z.string(),
          value: z.string().nullable(),
          probability: z.number(),
          color: z.string(),
          icon: z.string().nullable(),
          isActive: z.boolean(),
          order: z.number(),
          maxQuantity: z.number().nullable(),
          currentQuantity: z.number(),
        })
      )
      .optional(),
    spins: z
      .array(
        z.object({
          id: z.number(),
          employeeId: z.number(),
          employee: z
            .object({
              id: z.number(),
              name: z.string(),
              email: z.string(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
  message: z.string(),
})

export type GetSpinEventResType = z.TypeOf<typeof GetSpinEventRes>

// Create Spin Event Body
export const CreateSpinEventBody = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .strict()
  .refine(
    (data) => {
      if (data.endDate && data.endDate < data.startDate) {
        return false
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

export type CreateSpinEventBodyType = z.TypeOf<typeof CreateSpinEventBody>

// Create Spin Event Response
export const CreateSpinEventRes = z.object({
  data: SpinEventSchema,
  message: z.string(),
})

export type CreateSpinEventResType = z.TypeOf<typeof CreateSpinEventRes>

// Update Spin Event Body
export const UpdateSpinEventBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => {
      // This validation will be done in service layer with existing event data
      // For now, just check if both dates are provided
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        return false
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

export type UpdateSpinEventBodyType = z.TypeOf<typeof UpdateSpinEventBody>

// Update Spin Event Response
export const UpdateSpinEventRes = z.object({
  data: SpinEventSchema,
  message: z.string(),
})

export type UpdateSpinEventResType = z.TypeOf<typeof UpdateSpinEventRes>

// Delete Spin Event Response
export const DeleteSpinEventRes = z.object({
  data: z.object({
    success: z.boolean(),
  }),
  message: z.string(),
})

export type DeleteSpinEventResType = z.TypeOf<typeof DeleteSpinEventRes>

// Toggle Active Response
export const ToggleActiveRes = z.object({
  data: SpinEventSchema,
  message: z.string(),
})

export type ToggleActiveResType = z.TypeOf<typeof ToggleActiveRes>

// Spin Event ID Param
export const SpinEventIdParam = z.object({
  id: z.coerce.number(),
})

export type SpinEventIdParamType = z.TypeOf<typeof SpinEventIdParam>
