import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import spinRewardApiRequest from '@/apiRequests/spin-reward'
import {
  CreateSpinRewardBodyType,
  GetSpinRewardsQueryParamsType,
  UpdateSpinRewardBodyType,
  ReorderRewardsBodyType,
} from '@/schemaValidations/spin-reward.schema'

export const useGetSpinRewardsQuery = (queryParams?: GetSpinRewardsQueryParamsType) => {
  return useQuery({
    queryFn: () => spinRewardApiRequest.getRewards(queryParams),
    queryKey: ['spin-rewards', queryParams],
  })
}

export const useGetSpinRewardQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryFn: () => {
      if (!id || isNaN(id)) {
        throw new Error('Invalid reward ID')
      }
      return spinRewardApiRequest.getRewardById(id)
    },
    queryKey: ['spin-rewards', id],
    enabled: enabled && Boolean(id) && !isNaN(id),
  })
}

export const useCreateSpinRewardMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSpinRewardBodyType) => spinRewardApiRequest.createReward(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-rewards'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'rewards'] }) // Invalidate active rewards
    },
  })
}

export const useUpdateSpinRewardMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSpinRewardBodyType }) =>
      spinRewardApiRequest.updateReward(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spin-rewards'] })
      queryClient.invalidateQueries({ queryKey: ['spin-rewards', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'rewards'] }) // Invalidate active rewards
    },
  })
}

export const useDeleteSpinRewardMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => spinRewardApiRequest.deleteReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-rewards'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'rewards'] }) // Invalidate active rewards
    },
  })
}

export const useReorderRewardsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ReorderRewardsBodyType) => spinRewardApiRequest.reorderRewards(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-rewards'] })
      queryClient.invalidateQueries({ queryKey: ['employee-spin', 'rewards'] }) // Invalidate active rewards
    },
  })
}

export const useValidateProbabilitiesQuery = () => {
  return useQuery({
    queryFn: () => spinRewardApiRequest.validateProbabilities(),
    queryKey: ['spin-rewards', 'validate-probabilities'],
  })
}
