import prisma from '@/database'
import { ReviewStatus } from '@/schemaValidations/review.schema'

export interface ReviewFilters {
  status?: ReviewStatus
  guestId?: number
  minRating?: number
  maxRating?: number
}

export const reviewRepository = {
  // Create new review
  async create(data: {
    guestId: number
    overallRating: number
    foodQuality: number
    serviceQuality: number
    ambiance: number
    priceValue: number
    comment: string
    images?: string
    ipAddress?: string
    userAgent?: string
  }) {
    return await prisma.review.create({
      data: {
        ...data,
        status: 'HIDDEN' // Default to HIDDEN for admin approval
      },
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

  // Get visible reviews with pagination
  async findPublicReviews(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { status: 'VISIBLE' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.review.count({
        where: { status: 'VISIBLE' }
      })
    ])

    return { reviews, total }
  },

  // Get all reviews with filters (admin)
  async findAll(filters: ReviewFilters) {
    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.guestId) {
      where.guestId = filters.guestId
    }

    if (filters.minRating || filters.maxRating) {
      where.overallRating = {}
      if (filters.minRating) {
        where.overallRating.gte = filters.minRating
      }
      if (filters.maxRating) {
        where.overallRating.lte = filters.maxRating
      }
    }

    return await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

  // Get review by ID
  async findById(id: number) {
    return await prisma.review.findUnique({
      where: { id },
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

  // Update review status
  async updateStatus(id: number, status: ReviewStatus, accountId: number) {
    return await prisma.review.update({
      where: { id },
      data: {
        status,
        approvedBy: accountId,
        approvedAt: new Date()
      },
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

  // Add or update reply
  async addReply(id: number, replyContent: string, accountId: number) {
    return await prisma.review.update({
      where: { id },
      data: {
        replyContent,
        repliedBy: accountId,
        repliedAt: new Date()
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

  // Delete review
  async delete(id: number) {
    return await prisma.review.delete({
      where: { id }
    })
  },

  // Get review statistics
  async getStats() {
    const [totalReviews, visibleReviews, averageRating, ratingDistribution] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: 'VISIBLE' } }),
      prisma.review.aggregate({
        where: { status: 'VISIBLE' },
        _avg: {
          overallRating: true,
          foodQuality: true,
          serviceQuality: true,
          ambiance: true,
          priceValue: true
        }
      }),
      prisma.review.groupBy({
        by: ['overallRating'],
        where: { status: 'VISIBLE' },
        _count: true
      })
    ])

    return {
      totalReviews,
      visibleReviews,
      averageRating,
      ratingDistribution
    }
  }
}
