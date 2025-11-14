import z from 'zod'

export const ReviewStatusValues = ['HIDDEN', 'VISIBLE', 'DELETED'] as const

export const CreateReviewBody = z
  .object({
    guestId: z.number().int().positive(),
    overallRating: z.number().int().min(1).max(5),
    foodQuality: z.number().int().min(1).max(5),
    serviceQuality: z.number().int().min(1).max(5),
    ambiance: z.number().int().min(1).max(5),
    priceValue: z.number().int().min(1).max(5),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
    images: z.array(z.string()).max(5).optional(),
  })
  .strict()

export type CreateReviewBodyType = z.TypeOf<typeof CreateReviewBody>

export const UpdateReviewStatusBody = z
  .object({
    status: z.enum(ReviewStatusValues),
  })
  .strict()

export type UpdateReviewStatusBodyType = z.TypeOf<typeof UpdateReviewStatusBody>

export const ReplyToReviewBody = z
  .object({
    replyContent: z.string().min(10).max(500),
  })
  .strict()

export type ReplyToReviewBodyType = z.TypeOf<typeof ReplyToReviewBody>

export const ReviewRes = z.object({
  data: z.object({
    id: z.number(),
    guestId: z.number(),
    overallRating: z.number(),
    foodQuality: z.number(),
    serviceQuality: z.number(),
    ambiance: z.number(),
    priceValue: z.number(),
    comment: z.string(),
    images: z.string().nullable(),
    status: z.enum(ReviewStatusValues),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    approvedAt: z.date().nullable(),
    approvedBy: z.number().nullable(),
    replyContent: z.string().nullable(),
    repliedAt: z.date().nullable(),
    repliedBy: z.number().nullable(),
    guest: z
      .object({
        id: z.number(),
        name: z.string(),
      })
      .optional(),
    approver: z
      .object({
        id: z.number(),
        name: z.string(),
      })
      .nullable()
      .optional(),
    replier: z
      .object({
        id: z.number(),
        name: z.string(),
      })
      .nullable()
      .optional(),
  }),
  message: z.string(),
})

export type ReviewResType = z.TypeOf<typeof ReviewRes>

export const ReviewListRes = z.object({
  data: z.array(ReviewRes.shape.data),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
  message: z.string(),
})

export type ReviewListResType = z.TypeOf<typeof ReviewListRes>

export const ReviewStatsRes = z.object({
  data: z.object({
    totalReviews: z.number(),
    averageOverallRating: z.number(),
    averageFoodQuality: z.number(),
    averageServiceQuality: z.number(),
    averageAmbiance: z.number(),
    averagePriceValue: z.number(),
    ratingDistribution: z.object({
      '1': z.number(),
      '2': z.number(),
      '3': z.number(),
      '4': z.number(),
      '5': z.number(),
    }),
  }),
  message: z.string(),
})

export type ReviewStatsResType = z.TypeOf<typeof ReviewStatsRes>

export const ReviewQueryParams = z.object({
  status: z.enum(ReviewStatusValues).optional(),
  guestId: z.string().optional(),
  minRating: z.string().optional(),
  maxRating: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export type ReviewQueryParamsType = z.TypeOf<typeof ReviewQueryParams>
