import prisma from '@/database'
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
      images: data.images ? JSON.stringify(data.images) : null,
      status: ReviewStatus.HIDDEN,
      ipAddress,
      userAgent
    }

    return await prisma.review.create({
      data: reviewData,
      include: {
        guest: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  },

  // Public: Get visible reviews with pagination
  async getPublicReviews(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          status: ReviewStatus.VISIBLE
        },
        include: {
          guest: {
            select: {
              id: true,
              name: true
            }
          },
          replier: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.review.count({
        where: {
          status: ReviewStatus.VISIBLE
        }
      })
    ])

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
    const reviews = await prisma.review.findMany({
      where: {
        status: ReviewStatus.VISIBLE
      },
      select: {
        overallRating: true,
        foodQuality: true,
        serviceQuality: true,
        ambiance: true,
        priceValue: true
      }
    })

    const total = reviews.length
    if (total === 0) {
      return {
        totalReviews: 0,
        averageOverallRating: 0,
        averageFoodQuality: 0,
        averageServiceQuality: 0,
        averageAmbiance: 0,
        averagePriceValue: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      }
    }

    const sum = reviews.reduce(
      (acc, review) => ({
        overallRating: acc.overallRating + review.overallRating,
        foodQuality: acc.foodQuality + review.foodQuality,
        serviceQuality: acc.serviceQuality + review.serviceQuality,
        ambiance: acc.ambiance + review.ambiance,
        priceValue: acc.priceValue + review.priceValue
      }),
      { overallRating: 0, foodQuality: 0, serviceQuality: 0, ambiance: 0, priceValue: 0 }
    )

    const ratingDistribution = reviews.reduce(
      (acc, review) => {
        const rating = String(review.overallRating) as '1' | '2' | '3' | '4' | '5'
        acc[rating]++
        return acc
      },
      { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    )

    return {
      totalReviews: total,
      averageOverallRating: Math.round((sum.overallRating / total) * 10) / 10,
      averageFoodQuality: Math.round((sum.foodQuality / total) * 10) / 10,
      averageServiceQuality: Math.round((sum.serviceQuality / total) * 10) / 10,
      averageAmbiance: Math.round((sum.ambiance / total) * 10) / 10,
      averagePriceValue: Math.round((sum.priceValue / total) * 10) / 10,
      ratingDistribution
    }
  },

  // Admin: Get all reviews with filters
  async getAllReviews(filters: {
    status?: (typeof ReviewStatus)[keyof typeof ReviewStatus]
    guestId?: number
    minRating?: number
    maxRating?: number
    page?: number
    limit?: number
  }) {
    const { status, guestId, minRating, maxRating, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (guestId) where.guestId = guestId
    if (minRating || maxRating) {
      where.overallRating = {}
      if (minRating) where.overallRating.gte = minRating
      if (maxRating) where.overallRating.lte = maxRating
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          guest: {
            select: {
              id: true,
              name: true
            }
          },
          approver: {
            select: {
              id: true,
              name: true
            }
          },
          replier: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ])

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

  // Admin: Get review by ID
  async getReviewById(id: number) {
    return await prisma.review.findUnique({
      where: { id },
      include: {
        guest: {
          select: {
            id: true,
            name: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true
          }
        },
        replier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  },

  // Admin: Update review status
  async updateReviewStatus(id: number, status: (typeof ReviewStatus)[keyof typeof ReviewStatus], accountId: number) {
    return await prisma.$transaction(async (tx) => {
      const updateData: any = { status }

      // If approving (VISIBLE), record approver
      if (status === ReviewStatus.VISIBLE) {
        updateData.approvedAt = new Date()
        updateData.approvedBy = accountId
      }

      return await tx.review.update({
        where: { id },
        data: updateData,
        include: {
          guest: {
            select: {
              id: true,
              name: true
            }
          },
          approver: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    })
  },

  // Admin: Reply to review
  async replyToReview(id: number, data: ReplyToReviewBodyType, accountId: number) {
    return await prisma.review.update({
      where: { id },
      data: {
        replyContent: data.replyContent,
        repliedAt: new Date(),
        repliedBy: accountId
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true
          }
        },
        replier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  },

  // Admin: Delete review (soft delete)
  async deleteReview(id: number) {
    return await prisma.review.update({
      where: { id },
      data: {
        status: ReviewStatus.DELETED
      }
    })
  }
}
