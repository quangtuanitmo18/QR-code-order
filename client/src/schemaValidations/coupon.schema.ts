import { CouponDiscountTypeValues, CouponStatusValues } from '@/constants/type'
import z from 'zod'

export const CreateCouponBody = z.object({
  code: z.string().min(1).max(50),
  discountType: z.enum(CouponDiscountTypeValues),
  discountValue: z.coerce.number().int().min(0),
  minOrderAmount: z.coerce.number().int().min(0).optional(),
  applicableDishIds: z.string().optional(),
  maxTotalUsage: z.coerce.number().int().min(0).optional(),
  maxUsagePerGuest: z.coerce.number().int().min(0).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(CouponStatusValues).optional(),
})

export type CreateCouponBodyType = z.TypeOf<typeof CreateCouponBody>

export const UpdateCouponBody = z.object({
  discountType: z.enum(CouponDiscountTypeValues).optional(),
  discountValue: z.coerce.number().int().min(0).optional(),
  minOrderAmount: z.coerce.number().int().min(0).optional().nullable(),
  applicableDishIds: z.string().optional().nullable(),
  maxTotalUsage: z.coerce.number().int().min(0).optional().nullable(),
  maxUsagePerGuest: z.coerce.number().int().min(0).optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(CouponStatusValues).optional(),
})

export type UpdateCouponBodyType = z.TypeOf<typeof UpdateCouponBody>

export const ValidateCouponBody = z.object({
  code: z.string().min(1),
  orderTotal: z.coerce.number().int().min(0),
  dishIds: z.array(z.coerce.number().int()).optional(),
  guestId: z.coerce.number().int().optional(),
})

export type ValidateCouponBodyType = z.TypeOf<typeof ValidateCouponBody>

export const CouponSchema = z.object({
  id: z.number(),
  code: z.string(),
  discountType: z.string(),
  discountValue: z.coerce.number(),
  minOrderAmount: z.coerce.number().nullable(),
  applicableDishIds: z.string().nullable(),
  maxTotalUsage: z.coerce.number().nullable(),
  maxUsagePerGuest: z.coerce.number().nullable(),
  usageCount: z.coerce.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.string(),
  createdById: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type CouponSchemaType = z.TypeOf<typeof CouponSchema>

export const CouponRes = z.object({
  data: CouponSchema.extend({
    createdBy: z
      .object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
      })
      .optional(),
  }),
  message: z.string(),
})

export type CouponResType = z.TypeOf<typeof CouponRes>

export const CouponListRes = z.object({
  data: z.array(
    CouponSchema.extend({
      createdBy: z
        .object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
        })
        .optional(),
    })
  ),
  message: z.string(),
})

export type CouponListResType = z.TypeOf<typeof CouponListRes>

export const ValidateCouponRes = z.discriminatedUnion('valid', [
  z.object({
    valid: z.literal(true),
    coupon: z.object({
      id: z.number(),
      code: z.string(),
      discountType: z.string(),
      discountValue: z.coerce.number(),
    }),
    discountAmount: z.coerce.number(),
    finalAmount: z.coerce.number(),
  }),
  z.object({
    valid: z.literal(false),
    message: z.string(),
  }),
])

export type ValidateCouponResType = z.TypeOf<typeof ValidateCouponRes>

export const CouponParams = z.object({
  id: z.coerce.number(),
})

export type CouponParamsType = z.TypeOf<typeof CouponParams>


