import guestApiRequest from '@/apiRequests/guest'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useGuestLoginMutation = () => {
  return useMutation({
    mutationFn: guestApiRequest.login
  })
}

export const useGuestLogoutMutation = () => {
  return useMutation({
    mutationFn: guestApiRequest.logout
  })
}

export const useGuestOrderMutation = () => {
  return useMutation({
    mutationFn: guestApiRequest.order
  })
}

export const useGuestGetOrderListQuery = () => {
  return useQuery({
    queryFn: guestApiRequest.getOrderList,
    queryKey: ['guest-orders']
  })
}
