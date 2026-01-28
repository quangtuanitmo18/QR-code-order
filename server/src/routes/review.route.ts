import { reviewController } from '@/controllers/review.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import {
  CreateReviewBody,
  CreateReviewBodyType,
  ReplyToReviewBody,
  ReplyToReviewBodyType,
  ReviewListRes,
  ReviewListResType,
  ReviewQueryParams,
  ReviewQueryParamsType,
  ReviewRes,
  ReviewResType,
  ReviewStatsRes,
  ReviewStatsResType,
  UpdateReviewStatusBody,
  UpdateReviewStatusBodyType
} from '@/schemaValidations/review.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function reviewRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Public routes
  fastify.post<{
    Body: CreateReviewBodyType
    Reply: ReviewResType
  }>(
    '/',
    {
      schema: {
        body: CreateReviewBody,
        response: {
          201: ReviewRes
        }
      }
    },
    reviewController.createReview
  )

  fastify.get<{
    Querystring: { page?: string; limit?: string }
    Reply: ReviewListResType
  }>(
    '/',
    {
      schema: {
        response: {
          200: ReviewListRes
        }
      }
    },
    reviewController.getPublicReviews
  )

  fastify.get<{
    Reply: ReviewStatsResType
  }>(
    '/stats',
    {
      schema: {
        response: {
          200: ReviewStatsRes
        }
      }
    },
    reviewController.getReviewStats
  )

  // Admin routes
  fastify.get<{
    Querystring: ReviewQueryParamsType
    Reply: ReviewListResType
  }>(
    '/admin',
    {
      preHandler: [requireLoginedHook],
      schema: {
        querystring: ReviewQueryParams,
        response: {
          200: ReviewListRes
        }
      }
    },
    reviewController.getAllReviews
  )

  fastify.get<{
    Params: { id: string }
    Reply: ReviewResType
  }>(
    '/admin/:id',
    {
      preHandler: [requireLoginedHook],
      schema: {
        response: {
          200: ReviewRes
        }
      }
    },
    reviewController.getReviewById
  )

  fastify.patch<{
    Params: { id: string }
    Body: UpdateReviewStatusBodyType
    Reply: ReviewResType
  }>(
    '/admin/:id/status',
    {
      preHandler: [requireLoginedHook],
      schema: {
        body: UpdateReviewStatusBody,
        response: {
          200: ReviewRes
        }
      }
    },
    reviewController.updateReviewStatus
  )

  fastify.post<{
    Params: { id: string }
    Body: ReplyToReviewBodyType
    Reply: ReviewResType
  }>(
    '/admin/:id/reply',
    {
      preHandler: [requireLoginedHook],
      schema: {
        body: ReplyToReviewBody,
        response: {
          200: ReviewRes
        }
      }
    },
    reviewController.replyToReview
  )

  fastify.delete<{
    Params: { id: string }
  }>(
    '/admin/:id',
    {
      preHandler: [requireLoginedHook]
    },
    reviewController.deleteReview
  )
}
