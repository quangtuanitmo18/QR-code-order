import reviewApiRequest from '@/apiRequests/review'
import {
  CreateReviewBodyType,
  ReplyToReviewBodyType,
  UpdateReviewStatusBodyType,
} from '@/schemaValidations/review.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Public hooks
export const useReviewListQuery = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewApiRequest.list(params),
  })
}

export const useReviewStatsQuery = () => {
  return useQuery({
    queryKey: ['reviews-stats'],
    queryFn: () => reviewApiRequest.getStats(),
  })
}

export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateReviewBodyType) => reviewApiRequest.create(body),
    onSuccess: () => {
      // Invalidate stats to reflect new review (though it will be HIDDEN)
      queryClient.invalidateQueries({ queryKey: ['reviews-stats'] })
    },
  })
}

// Admin hooks
export const useAdminReviewListQuery = (params?: {
  status?: string
  guestId?: number
  minRating?: number
  maxRating?: number
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: ['admin-reviews', params],
    queryFn: () => reviewApiRequest.adminList(params),
  })
}

export const useAdminReviewByIdQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ['admin-review', id],
    queryFn: () => reviewApiRequest.adminGetById(id),
    enabled,
  })
}

export const useAdminUpdateReviewStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateReviewStatusBodyType }) =>
      reviewApiRequest.adminUpdateStatus(id, body),
    onSuccess: () => {
      // Invalidate both admin and public lists
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews-stats'] })
    },
  })
}

export const useAdminReplyToReviewMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReplyToReviewBodyType }) =>
      reviewApiRequest.adminReply(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useAdminDeleteReviewMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => reviewApiRequest.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews-stats'] })
    },
  })
}
