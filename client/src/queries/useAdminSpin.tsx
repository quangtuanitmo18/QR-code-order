import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminSpinApiRequest from '@/apiRequests/admin-spin'
import {
  GetAllSpinsQueryParamsType,
  GrantSpinBodyType,
  UpdateSpinBodyType,
} from '@/schemaValidations/employee-spin.schema'

export const useGetAllSpinsQuery = (queryParams?: GetAllSpinsQueryParamsType) => {
  return useQuery({
    queryFn: () => adminSpinApiRequest.getAllSpins(queryParams),
    queryKey: ['admin-spin', queryParams],
  })
}

export const useGrantSpinMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: GrantSpinBodyType) => adminSpinApiRequest.grantSpin(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spin'] })
      // Note: Don't invalidate employee-spin queries here as employee might not see the new spin
      // until they refresh or the spin is executed
    },
  })
}

export const useUpdateSpinMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ spinId, body }: { spinId: number; body: UpdateSpinBodyType }) =>
      adminSpinApiRequest.updateSpin(spinId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spin'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'my-spins'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'pending'] })
    },
  })
}

export const useGetStatisticsQuery = () => {
  return useQuery({
    queryFn: () => adminSpinApiRequest.getStatistics(),
    queryKey: ['admin-spin', 'statistics'],
  })
}
