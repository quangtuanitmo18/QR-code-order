import couponApiRequest from '@/apiRequests/coupon'
import { UpdateCouponBodyType, ValidateCouponBodyType } from '@/schemaValidations/coupon.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useCouponListQuery = (params?: {
  status?: string
  fromDate?: Date
  toDate?: Date
}) => {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: () => couponApiRequest.list(params),
  })
}

export const useGetCouponQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryKey: ['coupons', id],
    queryFn: () => {
      if (!id || isNaN(id)) {
        throw new Error('Invalid coupon ID')
      }
      return couponApiRequest.getCoupon(id)
    },
    enabled: enabled && Boolean(id) && !isNaN(id),
  })
}

export const useAddCouponMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: couponApiRequest.add,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coupons'],
      })
    },
  })
}

export const useUpdateCouponMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateCouponBodyType & { id: number }) =>
      couponApiRequest.updateCoupon(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coupons'],
        exact: true,
      })
    },
  })
}

export const useDeleteCouponMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: couponApiRequest.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coupons'],
      })
    },
  })
}

export const useValidateCouponMutation = () => {
  return useMutation({
    mutationFn: (body: ValidateCouponBodyType) => couponApiRequest.validate(body),
  })
}
