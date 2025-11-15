import { ReviewFilters, reviewRepository } from '@/repositories/review.repository'
import { CreateReviewBodyType, ReplyToReviewBodyType, ReviewStatus } from '@/schemaValidations/review.schema'

export const reviewService = {
  // Public: Create new review (auto HIDDEN status)
  async createReview(data: CreateReviewBodyType, ipAddress?: string, userAgent?: string) {
    const reviewData = {
      guestId: data.guestId,
      overallRating: data.overallRating,
      foodQuality: data.foodQuality,
      serviceQuality: data.serviceQuality,
      ambiance: data.ambiance,
      priceValue: data.priceValue,
      comment: data.comment,
      images: data.images ? JSON.stringify(data.images) : undefined,
      ipAddress,
      userAgent
    }

    return await reviewRepository.create(reviewData)
  },

  // Public: Get visible reviews with pagination
  async getPublicReviews(page = 1, limit = 10) {
    const { reviews, total } = await reviewRepository.findPublicReviews(page, limit)

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  // Public: Get review statistics (only VISIBLE reviews)
  async getReviewStats() {
    const { totalReviews, visibleReviews, averageRating, ratingDistribution } = await reviewRepository.getStats()

    if (visibleReviews === 0) {
      return {
        totalReviews: 0,
        averageOverallRating: 0,
        averageFoodQuality: 0,
        averageServiceQuality: 0,
        averageAmbiance: 0,
        averagePriceValue: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      }
    }

    // Format rating distribution
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratingDistribution.forEach((item) => {
      distribution[item.overallRating] = item._count
    })

    return {
      totalReviews,
      averageOverallRating: Number((averageRating._avg.overallRating || 0).toFixed(2)),
      averageFoodQuality: Number((averageRating._avg.foodQuality || 0).toFixed(2)),
      averageServiceQuality: Number((averageRating._avg.serviceQuality || 0).toFixed(2)),
      averageAmbiance: Number((averageRating._avg.ambiance || 0).toFixed(2)),
      averagePriceValue: Number((averageRating._avg.priceValue || 0).toFixed(2)),
      ratingDistribution: distribution
    }
  },

  // Admin: Get all reviews with filters (client-side pagination)
  async getAllReviews(filters: ReviewFilters) {
    return await reviewRepository.findAll(filters)
  },

  // Admin: Get review by ID
  async getReviewById(id: number) {
    return await reviewRepository.findById(id)
  },

  // Admin: Update review status
  async updateReviewStatus(id: number, status: ReviewStatus, accountId: number) {
    return await reviewRepository.updateStatus(id, status, accountId)
  },

  // Admin: Reply to review
  async replyToReview(id: number, data: ReplyToReviewBodyType, accountId: number) {
    return await reviewRepository.addReply(id, data.replyContent, accountId)
  },

  // Admin: Delete review
  async deleteReview(id: number) {
    return await reviewRepository.delete(id)
  }
}
