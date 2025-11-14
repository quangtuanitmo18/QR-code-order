import {
  CreateReviewBodyType,
  ReplyToReviewBodyType,
  ReviewQueryParamsType,
  UpdateReviewStatusBodyType
} from '@/schemaValidations/review.schema'
import { reviewService } from '@/services/review.service'
import { FastifyReply, FastifyRequest } from 'fastify'

export const reviewController = {
  // POST /api/reviews - Create new review (public)
  async createReview(
    request: FastifyRequest<{
      Body: CreateReviewBodyType
    }>,
    reply: FastifyReply
  ) {
    try {
      const ipAddress = request.ip
      const userAgent = request.headers['user-agent']

      const review = await reviewService.createReview(request.body, ipAddress, userAgent)

      return reply.status(201).send({
        data: review,
        message: 'Review created successfully. It will be visible after admin approval.'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to create review'
      })
    }
  },

  // GET /api/reviews - Get public visible reviews
  async getPublicReviews(
    request: FastifyRequest<{
      Querystring: { page?: string; limit?: string }
    }>,
    reply: FastifyReply
  ) {
    try {
      const page = parseInt(request.query.page || '1')
      const limit = parseInt(request.query.limit || '10')

      if (isNaN(page) || page < 1) {
        return reply.status(400).send({ message: 'Invalid page number' })
      }
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return reply.status(400).send({ message: 'Invalid limit (must be 1-100)' })
      }

      const result = await reviewService.getPublicReviews(page, limit)

      return reply.status(200).send({
        data: result.reviews,
        pagination: result.pagination,
        message: 'Reviews retrieved successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to get reviews'
      })
    }
  },

  // GET /api/reviews/stats - Get review statistics
  async getReviewStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await reviewService.getReviewStats()

      return reply.status(200).send({
        data: stats,
        message: 'Review statistics retrieved successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to get review statistics'
      })
    }
  },

  // GET /api/admin/reviews - Get all reviews with filters (admin)
  async getAllReviews(
    request: FastifyRequest<{
      Querystring: ReviewQueryParamsType
    }>,
    reply: FastifyReply
  ) {
    try {
      // Zod will handle coercion from string to number with z.coerce
      const filters = {
        status: request.query.status as any,
        guestId: request.query.guestId,
        minRating: request.query.minRating,
        maxRating: request.query.maxRating,
        page: request.query.page,
        limit: request.query.limit
      }

      const result = await reviewService.getAllReviews(filters)

      return reply.status(200).send({
        data: result.reviews,
        pagination: result.pagination,
        message: 'Reviews retrieved successfully'
      })
    } catch (error: any) {
      return reply.status(500).send({
        message: error.message || 'Failed to get reviews'
      })
    }
  },

  // GET /api/admin/reviews/:id - Get review by ID (admin)
  async getReviewById(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
    reply: FastifyReply
  ) {
    try {
      const id = parseInt(request.params.id)

      if (isNaN(id) || id < 1) {
        return reply.status(400).send({ message: 'Invalid review ID' })
      }

      const review = await reviewService.getReviewById(id)

      if (!review) {
        return reply.status(404).send({
          message: 'Review not found'
        })
      }

      return reply.status(200).send({
        data: review,
        message: 'Review retrieved successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to get review'
      })
    }
  },

  // PATCH /api/admin/reviews/:id/status - Update review status (admin)
  async updateReviewStatus(
    request: FastifyRequest<{
      Params: { id: string }
      Body: UpdateReviewStatusBodyType
    }>,
    reply: FastifyReply
  ) {
    try {
      const id = parseInt(request.params.id)
      const accountId = (request as any).decodedAccessToken?.userId

      if (isNaN(id) || id < 1) {
        return reply.status(400).send({ message: 'Invalid review ID' })
      }

      if (!accountId) {
        return reply.status(401).send({
          message: 'Unauthorized'
        })
      }

      const review = await reviewService.updateReviewStatus(id, request.body.status as any, accountId)

      return reply.status(200).send({
        data: review,
        message: 'Review status updated successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to update review status'
      })
    }
  },

  // POST /api/admin/reviews/:id/reply - Reply to review (admin)
  async replyToReview(
    request: FastifyRequest<{
      Params: { id: string }
      Body: ReplyToReviewBodyType
    }>,
    reply: FastifyReply
  ) {
    try {
      const id = parseInt(request.params.id)
      const accountId = (request as any).decodedAccessToken?.userId

      if (isNaN(id) || id < 1) {
        return reply.status(400).send({ message: 'Invalid review ID' })
      }

      if (!accountId) {
        return reply.status(401).send({
          message: 'Unauthorized'
        })
      }

      const review = await reviewService.replyToReview(id, request.body, accountId)

      return reply.status(200).send({
        data: review,
        message: 'Reply added successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to add reply'
      })
    }
  },

  // DELETE /api/admin/reviews/:id - Delete review (admin)
  async deleteReview(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
    reply: FastifyReply
  ) {
    try {
      const id = parseInt(request.params.id)

      if (isNaN(id) || id < 1) {
        return reply.status(400).send({ message: 'Invalid review ID' })
      }

      await reviewService.deleteReview(id)

      return reply.status(200).send({
        message: 'Review deleted successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to delete review'
      })
    }
  }
}
