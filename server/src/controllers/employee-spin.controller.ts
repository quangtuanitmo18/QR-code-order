import {
  EmployeeSpinIdParamType,
  ExecuteSpinBodyType,
  GetActiveRewardsQueryParamsType,
  GetEmployeeSpinsQueryParamsType,
  GetPendingRewardsQueryParamsType
} from '@/schemaValidations/employee-spin.schema'
import { employeeSpinService } from '@/services/employee-spin.service'
import { spinRewardService } from '@/services/spin-reward.service'
import { FastifyInstance } from 'fastify'

// Note: getMySpinsController does client-side pagination
// This is acceptable since employees typically won't have thousands of spins
// For better performance with large datasets, consider adding pagination to repository

export const getActiveRewardsController = async (query?: GetActiveRewardsQueryParamsType) => {
  return await spinRewardService.getActiveRewards(query?.eventId)
}

export const getMySpinsController = async (employeeId: number, query: GetEmployeeSpinsQueryParamsType) => {
  const filters: { status?: string; eventId?: number } = {}

  if (query.status) {
    filters.status = query.status
  }

  if (query.eventId !== undefined) {
    filters.eventId = query.eventId
  }

  console.log('query', query)
  console.log('filters', filters)
  console.log('employeeId', employeeId)

  const spins = await employeeSpinService.getEmployeeSpins(employeeId, filters)

  // Debug: Log result count
  console.log('[getMySpinsController] Result count:', spins.length)

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

export const getPendingRewardsController = async (employeeId: number, query?: GetPendingRewardsQueryParamsType) => {
  return await employeeSpinService.getPendingRewards(employeeId, query?.eventId)
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
