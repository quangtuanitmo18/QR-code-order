import http from '@/lib/http'
import {
  ClaimRewardResType,
  ExecuteSpinBodyType,
  ExecuteSpinResType,
  GetActiveRewardsResType,
  GetEmployeeSpinsQueryParamsType,
  GetEmployeeSpinsResType,
  GetPendingRewardsResType,
} from '@/schemaValidations/employee-spin.schema'

export const employeeSpinApiRequest = {
  getActiveRewards: () => http.get<GetActiveRewardsResType>('/employee-spin/rewards'),

  getMySpins: (queryParams?: GetEmployeeSpinsQueryParamsType) =>
    http.get<GetEmployeeSpinsResType>('/employee-spin/my-spins', {
      params: queryParams,
    }),

  getPendingRewards: () => http.get<GetPendingRewardsResType>('/employee-spin/pending'),

  executeSpin: (body: ExecuteSpinBodyType) =>
    http.post<ExecuteSpinResType>('/employee-spin/spin', body),

  claimReward: (spinId: number) =>
    http.post<ClaimRewardResType>(`/employee-spin/claim/${spinId}`, {}),
}

export default employeeSpinApiRequest
