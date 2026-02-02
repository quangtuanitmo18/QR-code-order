import http from '@/lib/http'
import {
    ClaimRewardResType,
    ExecuteSpinBodyType,
    ExecuteSpinResType,
    GetActiveRewardsQueryParamsType,
    GetActiveRewardsResType,
    GetEmployeeSpinsQueryParamsType,
    GetEmployeeSpinsResType,
    GetPendingRewardsQueryParamsType,
    GetPendingRewardsResType,
} from '@/schemaValidations/employee-spin.schema'

export const employeeSpinApiRequest = {
  getActiveRewards: (queryParams?: GetActiveRewardsQueryParamsType) =>
    http.get<GetActiveRewardsResType>('/employee-spin/rewards', {
      params: queryParams,
    }),

  getMySpins: (queryParams?: GetEmployeeSpinsQueryParamsType) =>
    http.get<GetEmployeeSpinsResType>('/employee-spin/my-spins', {
      params: queryParams,
    }),

  getPendingRewards: (queryParams?: GetPendingRewardsQueryParamsType) =>
    http.get<GetPendingRewardsResType>('/employee-spin/pending', {
      params: queryParams,
    }),

  executeSpin: (body: ExecuteSpinBodyType) =>
    http.post<ExecuteSpinResType>('/employee-spin/spin', body),

  claimReward: (spinId: number) =>
    http.post<ClaimRewardResType>(`/employee-spin/claim/${spinId}`, {}),
}

export default employeeSpinApiRequest
