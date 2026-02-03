import { z } from 'zod'
import { SpinEventSchema } from './spin-event.schema'

// SpinReward Schema (for responses - dates as ISO strings)
export const SpinRewardSchema = z.object({
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
  version: z.number(),
  eventId: z.number().nullable().optional(), // Foreign key to SpinEvent
  event: SpinEventSchema.nullable().optional().default(null),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
})

export type SpinRewardType = z.TypeOf<typeof SpinRewardSchema>

// Get Spin Rewards Query Parameters
export const GetSpinRewardsQueryParams = z.object({
  isActive: z.coerce.boolean().optional(),
})

export type GetSpinRewardsQueryParamsType = z.TypeOf<typeof GetSpinRewardsQueryParams>

// Get Spin Rewards Response
export const GetSpinRewardsRes = z.object({
  data: z.array(SpinRewardSchema),
  message: z.string(),
})

export type GetSpinRewardsResType = z.TypeOf<typeof GetSpinRewardsRes>

// Get Spin Reward by ID Response
export const GetSpinRewardRes = z.object({
  data: SpinRewardSchema,
  message: z.string(),
})

export type GetSpinRewardResType = z.TypeOf<typeof GetSpinRewardRes>

// Create Spin Reward Body
export const CreateSpinRewardBody = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    type: z.string().min(1).max(100),
    value: z.string().max(1000).optional(), // JSON string
    probability: z.number().min(0).max(1),
    color: z.string().min(1).max(50), // Tailwind color class
    icon: z.string().max(50).optional(), // Icon name from lucide-react
    isActive: z.boolean().optional().default(true),
    order: z.number().int().min(0).optional().default(0),
    maxQuantity: z.number().int().positive().optional(), // NULL = unlimited, number > 0 = limited
    eventId: z.number().int().positive(), // Required: must belong to an event
  })
  .strict()

export type CreateSpinRewardBodyType = z.TypeOf<typeof CreateSpinRewardBody>

// Create Spin Reward Response
export const CreateSpinRewardRes = z.object({
  data: SpinRewardSchema,
  message: z.string(),
})

export type CreateSpinRewardResType = z.TypeOf<typeof CreateSpinRewardRes>

// Update Spin Reward Body
export const UpdateSpinRewardBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    type: z.string().min(1).max(100).optional(),
    value: z.string().max(1000).optional().nullable(), // JSON string
    probability: z.number().min(0).max(1).optional(),
    color: z.string().min(1).max(50).optional(), // Tailwind color class
    icon: z.string().max(50).optional().nullable(), // Icon name from lucide-react
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    maxQuantity: z.number().int().positive().optional().nullable(), // NULL = unlimited, number > 0 = limited
  })
  .strict()

export type UpdateSpinRewardBodyType = z.TypeOf<typeof UpdateSpinRewardBody>

// Update Spin Reward Response
export const UpdateSpinRewardRes = z.object({
  data: SpinRewardSchema,
  message: z.string(),
})

export type UpdateSpinRewardResType = z.TypeOf<typeof UpdateSpinRewardRes>

// Delete Spin Reward Response
export const DeleteSpinRewardRes = z.object({
  data: z.object({
    success: z.boolean(),
  }),
  message: z.string(),
})

export type DeleteSpinRewardResType = z.TypeOf<typeof DeleteSpinRewardRes>

// Reorder Rewards Body
export const ReorderRewardsBody = z.object({
  rewards: z.array(
    z.object({
      id: z.number().int().positive(),
      order: z.number().int().min(0),
    })
  ),
})

export type ReorderRewardsBodyType = z.TypeOf<typeof ReorderRewardsBody>

// Reorder Rewards Response
export const ReorderRewardsRes = z.object({
  message: z.string(),
})

export type ReorderRewardsResType = z.TypeOf<typeof ReorderRewardsRes>

// Spin Reward ID Param
export const SpinRewardIdParam = z.object({
  id: z.coerce.number(),
})

export type SpinRewardIdParamType = z.TypeOf<typeof SpinRewardIdParam>
