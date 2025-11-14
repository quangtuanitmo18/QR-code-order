import http from '@/lib/http'
import {
  CreateReviewBodyType,
  ReplyToReviewBodyType,
  ReviewListResType,
  ReviewResType,
  ReviewStatsResType,
  UpdateReviewStatusBodyType,
} from '@/schemaValidations/review.schema'

const reviewApiRequest = {
  // Public APIs
  create: (body: CreateReviewBodyType) => http.post<ReviewResType>('/reviews', body),

  list: (params?: { page?: number; limit?: number }) =>
    http.get<ReviewListResType>('/reviews', {
      params,
      next: { tags: ['reviews'] },
    }),

  getStats: () =>
    http.get<ReviewStatsResType>('/reviews/stats', {
      next: { tags: ['reviews-stats'] },
    }),

  // Admin APIs
  adminList: (params?: {
    status?: string
    guestId?: number
    minRating?: number
    maxRating?: number
    page?: number
    limit?: number
  }) =>
    http.get<ReviewListResType>('/reviews/admin', {
      params,
      next: { tags: ['admin-reviews'] },
    }),

  adminGetById: (id: number) => http.get<ReviewResType>(`/reviews/admin/${id}`),

  adminUpdateStatus: (id: number, body: UpdateReviewStatusBodyType) =>
    http.patch<ReviewResType>(`/reviews/admin/${id}/status`, body),

  adminReply: (id: number, body: ReplyToReviewBodyType) =>
    http.post<ReviewResType>(`/reviews/admin/${id}/reply`, body),

  adminDelete: (id: number) => http.delete<{ message: string }>(`/reviews/admin/${id}`),
}

export default reviewApiRequest
