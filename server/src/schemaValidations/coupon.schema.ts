import { CouponDiscountTypeValues, CouponStatusValues } from '@/constants/type'
import z from 'zod'

export const CreateCouponBody = z.object({
  code: z.string().min(1).max(50),
  discountType: z.enum(CouponDiscountTypeValues),
  discountValue: z.number().int().min(0),
  minOrderAmount: z.number().int().min(0).optional(),
  applicableDishIds: z.string().optional(),
  maxTotalUsage: z.number().int().min(0).optional(),
  maxUsagePerGuest: z.number().int().min(0).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(CouponStatusValues).optional()
})

export type CreateCouponBodyType = z.TypeOf<typeof CreateCouponBody>

export const UpdateCouponBody = z.object({
  discountType: z.enum(CouponDiscountTypeValues).optional(),
  discountValue: z.number().int().min(0).optional(),
  minOrderAmount: z.number().int().min(0).optional().nullable(),
  applicableDishIds: z.string().optional().nullable(),
  maxTotalUsage: z.number().int().min(0).optional().nullable(),
  maxUsagePerGuest: z.number().int().min(0).optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(CouponStatusValues).optional()
})

export type UpdateCouponBodyType = z.TypeOf<typeof UpdateCouponBody>

export const ValidateCouponBody = z.object({
  code: z.string().min(1),
  orderTotal: z.number().int().min(0),
  dishIds: z.array(z.number().int()).optional(),
  guestId: z.number().int().optional()
})

export type ValidateCouponBodyType = z.TypeOf<typeof ValidateCouponBody>

export const CouponSchema = z.object({
  id: z.number(),
  code: z.string(),
  discountType: z.string(),
  discountValue: z.number(),
  minOrderAmount: z.number().nullable(),
  applicableDishIds: z.string().nullable(),
  maxTotalUsage: z.number().nullable(),
  maxUsagePerGuest: z.number().nullable(),
  usageCount: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  createdById: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CouponSchemaType = z.TypeOf<typeof CouponSchema>

export const GetCouponsQueryParams = z.object({
  status: z.enum(CouponStatusValues).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
})

export type GetCouponsQueryParamsType = z.TypeOf<typeof GetCouponsQueryParams>

export const ValidateCouponRes = z.discriminatedUnion('valid', [
  z.object({
    valid: z.literal(true),
    coupon: z.object({
      id: z.number(),
      code: z.string(),
      discountType: z.string(),
      discountValue: z.number()
    }),
    discountAmount: z.number(),
    finalAmount: z.number()
  }),
  z.object({
    valid: z.literal(false),
    message: z.string()
  })
])

export type ValidateCouponResType = z.TypeOf<typeof ValidateCouponRes>

export const CouponParam = z.object({
  id: z.coerce.number()
})

export type CouponParamType = z.TypeOf<typeof CouponParam>

export const GetCouponsRes = z.object({
  message: z.string(),
  data: z.array(CouponSchema.extend({
    createdBy: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string()
    }).optional()
  }))
})

export type GetCouponsResType = z.TypeOf<typeof GetCouponsRes>

export const GetCouponRes = z.object({
  message: z.string(),
  data: CouponSchema.extend({
    createdBy: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string()
    }).optional()
  })
})

export type GetCouponResType = z.TypeOf<typeof GetCouponRes>

export const CreateCouponRes = z.object({
  message: z.string(),
  data: CouponSchema
})

export type CreateCouponResType = z.TypeOf<typeof CreateCouponRes>

export const UpdateCouponRes = z.object({
  message: z.string(),
  data: CouponSchema
})

export type UpdateCouponResType = z.TypeOf<typeof UpdateCouponRes>

export const DeleteCouponRes = z.object({
  message: z.string(),
  data: CouponSchema
})

export type DeleteCouponResType = z.TypeOf<typeof DeleteCouponRes>


