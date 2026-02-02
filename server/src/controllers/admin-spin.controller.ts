import { adminSpinService } from '@/services/admin-spin.service'
import {
  GrantSpinBodyType,
  GetAllSpinsQueryParamsType,
  UpdateSpinBodyType,
  EmployeeSpinIdParamType
} from '@/schemaValidations/employee-spin.schema'

export const grantSpinController = async (adminId: number, body: GrantSpinBodyType) => {
  return await adminSpinService.grantSpin({
    employeeId: body.employeeId,
    adminId,
    notes: body.notes,
    expiredAt: body.expiredAt
  })
}

export const getAllSpinsController = async (query: GetAllSpinsQueryParamsType) => {
  return await adminSpinService.getAllSpins({
    employeeId: query.employeeId,
    status: query.status,
    fromDate: query.fromDate,
    toDate: query.toDate,
    page: query.page,
    limit: query.limit
  })
}

export const updateSpinController = async (params: EmployeeSpinIdParamType, body: UpdateSpinBodyType) => {
  return await adminSpinService.updateSpin(params.spinId, {
    notes: body.notes,
    status: body.status,
    expiredAt: body.expiredAt
  })
}

export const getStatisticsController = async () => {
  return await adminSpinService.getStatistics()
}
