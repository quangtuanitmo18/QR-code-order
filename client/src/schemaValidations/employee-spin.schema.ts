import { z } from 'zod'

// EmployeeSpin Status Enum
export const EmployeeSpinStatusValues = ['PENDING', 'CLAIMED', 'EXPIRED'] as const

// EmployeeSpin Schema (for responses - dates as ISO strings)
export const EmployeeSpinSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  rewardId: z.number(),
  status: z.string(),
  claimedAt: z.string().nullable(), // ISO date string
  expiredAt: z.string().nullable(), // ISO date string
  spinDate: z.string(), // ISO date string
  notes: z.string().nullable(),
  createdById: z.number().nullable(),
  employee: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      avatar: z.string().nullable(),
    })
    .optional(),
  reward: z
    .object({
      id: z.number(),
      name: z.string(),
      type: z.string(),
      value: z.string().nullable(),
      color: z.string(),
      icon: z.string().nullable(),
    })
    .optional(),
  createdBy: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
})

export type EmployeeSpinType = z.TypeOf<typeof EmployeeSpinSchema>

// Get Employee Spins Query Parameters
export const GetEmployeeSpinsQueryParams = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum(EmployeeSpinStatusValues).optional(),
})

export type GetEmployeeSpinsQueryParamsType = z.TypeOf<typeof GetEmployeeSpinsQueryParams>

// Get Employee Spins Response (paginated)
export const GetEmployeeSpinsRes = z.object({
  data: z.object({
    spins: z.array(EmployeeSpinSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
  message: z.string(),
})

export type GetEmployeeSpinsResType = z.TypeOf<typeof GetEmployeeSpinsRes>

// Get Employee Spin by ID Response
export const GetEmployeeSpinRes = z.object({
  data: EmployeeSpinSchema,
  message: z.string(),
})

export type GetEmployeeSpinResType = z.TypeOf<typeof GetEmployeeSpinRes>

// Get Active Rewards Response (for spin wheel)
export const GetActiveRewardsRes = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().nullable(),
      type: z.string(),
      value: z.string().nullable(),
      probability: z.number(),
      color: z.string(),
      icon: z.string().nullable(),
      order: z.number(),
    })
  ),
  message: z.string(),
})

export type GetActiveRewardsResType = z.TypeOf<typeof GetActiveRewardsRes>

// Get Pending Rewards Response
export const GetPendingRewardsRes = z.object({
  data: z.array(EmployeeSpinSchema),
  message: z.string(),
})

export type GetPendingRewardsResType = z.TypeOf<typeof GetPendingRewardsRes>

// Execute Spin Body
export const ExecuteSpinBody = z.object({
  spinId: z.number().int().positive(),
})

export type ExecuteSpinBodyType = z.TypeOf<typeof ExecuteSpinBody>

// Execute Spin Response
export const ExecuteSpinRes = z.object({
  data: EmployeeSpinSchema,
  message: z.string(),
})

export type ExecuteSpinResType = z.TypeOf<typeof ExecuteSpinRes>

// Claim Reward Response
export const ClaimRewardRes = z.object({
  data: EmployeeSpinSchema,
  message: z.string(),
})

export type ClaimRewardResType = z.TypeOf<typeof ClaimRewardRes>

// Grant Spin Body (Admin)
export const GrantSpinBody = z.object({
  employeeId: z.number().int().positive(),
  notes: z.string().max(500).optional(),
  expiredAt: z.coerce.date().optional(), // Date input, will be converted to ISO string
})

export type GrantSpinBodyType = z.TypeOf<typeof GrantSpinBody>

// Grant Spin Response
export const GrantSpinRes = z.object({
  data: EmployeeSpinSchema,
  message: z.string(),
})

export type GrantSpinResType = z.TypeOf<typeof GrantSpinRes>

// Get All Spins Query Parameters (Admin)
export const GetAllSpinsQueryParams = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  status: z.enum(EmployeeSpinStatusValues).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

export type GetAllSpinsQueryParamsType = z.TypeOf<typeof GetAllSpinsQueryParams>

// Get All Spins Response (Admin, paginated)
export const GetAllSpinsRes = z.object({
  data: z.object({
    spins: z.array(EmployeeSpinSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
  message: z.string(),
})

export type GetAllSpinsResType = z.TypeOf<typeof GetAllSpinsRes>

// Update Spin Body (Admin)
export const UpdateSpinBody = z.object({
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(EmployeeSpinStatusValues).optional(),
  expiredAt: z.coerce.date().optional().nullable(), // Date input, will be converted to ISO string
})

export type UpdateSpinBodyType = z.TypeOf<typeof UpdateSpinBody>

// Update Spin Response
export const UpdateSpinRes = z.object({
  data: EmployeeSpinSchema,
  message: z.string(),
})

export type UpdateSpinResType = z.TypeOf<typeof UpdateSpinRes>

// Employee Spin ID Param
export const EmployeeSpinIdParam = z.object({
  spinId: z.coerce.number(),
})

export type EmployeeSpinIdParamType = z.TypeOf<typeof EmployeeSpinIdParam>
