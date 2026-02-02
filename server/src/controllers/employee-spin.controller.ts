import { employeeSpinService } from '@/services/employee-spin.service'
import {
  GetEmployeeSpinsQueryParamsType,
  ExecuteSpinBodyType,
  EmployeeSpinIdParamType
} from '@/schemaValidations/employee-spin.schema'
import { FastifyInstance } from 'fastify'

// Note: getMySpinsController does client-side pagination
// This is acceptable since employees typically won't have thousands of spins
// For better performance with large datasets, consider adding pagination to repository

export const getActiveRewardsController = async () => {
  return await employeeSpinService.getActiveRewards()
}

export const getMySpinsController = async (employeeId: number, query: GetEmployeeSpinsQueryParamsType) => {
  const spins = await employeeSpinService.getEmployeeSpins(employeeId, {
    status: query.status,
    fromDate: query.fromDate,
    toDate: query.toDate
  })

  // Calculate pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const total = spins.length
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedSpins = spins.slice(startIndex, endIndex)

  return {
    spins: paginatedSpins,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const getPendingRewardsController = async (employeeId: number) => {
  return await employeeSpinService.getPendingRewards(employeeId)
}

export const executeSpinController = async (
  employeeId: number,
  body: ExecuteSpinBodyType,
  fastify: FastifyInstance
) => {
  return await employeeSpinService.executeSpin(body.spinId, employeeId, fastify)
}

export const claimRewardController = async (employeeId: number, params: EmployeeSpinIdParamType) => {
  return await employeeSpinService.claimReward(params.spinId, employeeId)
}
