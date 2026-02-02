import employeeSpinApiRequest from '@/apiRequests/employee-spin'
import {
    ExecuteSpinBodyType,
    GetActiveRewardsQueryParamsType,
    GetEmployeeSpinsQueryParamsType,
    GetPendingRewardsQueryParamsType,
} from '@/schemaValidations/employee-spin.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useGetActiveRewardsQuery = (queryParams?: GetActiveRewardsQueryParamsType) => {
  return useQuery({
    queryFn: () => employeeSpinApiRequest.getActiveRewards(queryParams),
    queryKey: ['employee-spin', 'rewards', queryParams],
  })
}

export const useGetMySpinsQuery = (queryParams?: GetEmployeeSpinsQueryParamsType) => {
  return useQuery({
    queryFn: () => employeeSpinApiRequest.getMySpins(queryParams),
    queryKey: ['employee-spin', 'my-spins', queryParams],
  })
}

export const useGetPendingRewardsQuery = (queryParams?: GetPendingRewardsQueryParamsType) => {
  return useQuery({
    queryFn: () => employeeSpinApiRequest.getPendingRewards(queryParams),
    queryKey: ['employee-spin', 'pending', queryParams],
  })
}

export const useExecuteSpinMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ExecuteSpinBodyType) => employeeSpinApiRequest.executeSpin(body),
    onSuccess: () => {
      // Invalidate all employee spin related queries
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'my-spins'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'rewards'] }) // In case quantity changed
      queryClient.invalidateQueries({ queryKey: ['admin-spin'] }) // Invalidate admin view
    },
  })
}

export const useClaimRewardMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (spinId: number) => employeeSpinApiRequest.claimReward(spinId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'my-spins'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-spin'] }) // Invalidate admin view
    },
  })
}
