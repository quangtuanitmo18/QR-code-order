import http from '@/lib/http'
import {
  CreateSpinRewardBodyType,
  CreateSpinRewardResType,
  DeleteSpinRewardResType,
  GetSpinRewardResType,
  GetSpinRewardsQueryParamsType,
  GetSpinRewardsResType,
  ReorderRewardsBodyType,
  ReorderRewardsResType,
  UpdateSpinRewardBodyType,
  UpdateSpinRewardResType,
} from '@/schemaValidations/spin-reward.schema'

export const spinRewardApiRequest = {
  getRewards: (queryParams?: GetSpinRewardsQueryParamsType) =>
    http.get<GetSpinRewardsResType>('/admin/spin-rewards', {
      params: queryParams,
    }),

  getRewardById: (id: number) => http.get<GetSpinRewardResType>(`/admin/spin-rewards/${id}`),

  createReward: (body: CreateSpinRewardBodyType) =>
    http.post<CreateSpinRewardResType>('/admin/spin-rewards', body),

  updateReward: (id: number, body: UpdateSpinRewardBodyType) =>
    http.put<UpdateSpinRewardResType>(`/admin/spin-rewards/${id}`, body),

  deleteReward: (id: number) => http.delete<DeleteSpinRewardResType>(`/admin/spin-rewards/${id}`),

  reorderRewards: (body: ReorderRewardsBodyType) =>
    http.post<ReorderRewardsResType>('/admin/spin-rewards/reorder', body),

  validateProbabilities: () =>
    http.get<{ isValid: boolean; total: number; message: string }>(
      '/admin/spin-rewards/validate-probabilities'
    ),
}

export default spinRewardApiRequest
