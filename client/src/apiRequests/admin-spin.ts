import http from '@/lib/http'
import {
  GetAllSpinsQueryParamsType,
  GetAllSpinsResType,
  GrantSpinBodyType,
  GrantSpinResType,
  UpdateSpinBodyType,
  UpdateSpinResType,
} from '@/schemaValidations/employee-spin.schema'

export const adminSpinApiRequest = {
  getAllSpins: (queryParams?: GetAllSpinsQueryParamsType) =>
    http.get<GetAllSpinsResType>('/admin/employee-spins', {
      params: queryParams,
    }),

  grantSpin: (body: GrantSpinBodyType) =>
    http.post<GrantSpinResType>('/admin/employee-spins/grant', body),

  updateSpin: (spinId: number, body: UpdateSpinBodyType) =>
    http.put<UpdateSpinResType>(`/admin/employee-spins/${spinId}`, body),

  getStatistics: () =>
    http.get<{
      totalSpins: number
      totalRewards: number
      claimRate: number
      topRewards: any[]
      topEmployees: any[]
      message: string
    }>('/admin/employee-spins/statistics'),
}

export default adminSpinApiRequest
