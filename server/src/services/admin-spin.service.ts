import { employeeSpinRepository } from '@/repositories/employee-spin.repository'
import { spinRewardRepository } from '@/repositories/spin-reward.repository'
import { EntityError } from '@/utils/errors'
import prisma from '@/database'

export const adminSpinService = {
  /**
   * Grant spin to employee
   * @throws {EntityError} if employee not found
   */
  async grantSpin(data: { employeeId: number; adminId: number; notes?: string | null; expiredAt?: Date | null }) {
    // Verify employee exists
    const employee = await prisma.account.findUnique({
      where: { id: data.employeeId },
      select: { id: true, role: true }
    })

    if (!employee) {
      throw new EntityError([{ field: 'employeeId', message: 'Employee not found' }])
    }

    if (employee.role !== 'Employee') {
      throw new EntityError([{ field: 'employeeId', message: 'Account is not an employee' }])
    }

    // Create spin with status PENDING
    // NOTE: rewardId is required by schema but will be updated when spin is executed.
    // We use the first active reward as a placeholder. This is a workaround because:
    // - Prisma schema requires rewardId to be non-nullable (foreign key constraint)
    // - Design requires spin to be created without reward (reward assigned on execution)
    // - The rewardId will be properly updated in executeSpin() method
    const firstReward = await spinRewardRepository.findActive()
    if (firstReward.length === 0) {
      throw new EntityError([
        { field: 'rewards', message: 'No active rewards available. Please create rewards first.' }
      ])
    }

    // Create spin with placeholder rewardId (will be updated on spin execution)
    const spin = await employeeSpinRepository.create({
      employeeId: data.employeeId,
      rewardId: firstReward[0].id, // Placeholder - will be updated in executeSpin()
      status: 'PENDING',
      expiredAt: data.expiredAt ?? null,
      notes: data.notes ?? null,
      createdById: data.adminId
    })

    return spin
  },

  /**
   * Get all spins with filters and pagination (admin)
   */
  async getAllSpins(filters?: {
    employeeId?: number
    status?: string
    fromDate?: Date
    toDate?: Date
    page?: number
    limit?: number
  }) {
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 10

    const result = await employeeSpinRepository.findAll(
      {
        employeeId: filters?.employeeId,
        status: filters?.status,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate
      },
      { page, limit }
    )

    return result
  },

  /**
   * Update spin (admin override)
   * @throws {EntityError} if spin not found
   */
  async updateSpin(
    id: number,
    data: {
      notes?: string | null
      status?: string
      expiredAt?: Date | null
    }
  ) {
    const spin = await employeeSpinRepository.findById(id)

    if (!spin) {
      throw new EntityError([{ field: 'id', message: 'Spin not found' }])
    }

    const updated = await employeeSpinRepository.update(id, {
      notes: data.notes,
      status: data.status,
      expiredAt: data.expiredAt
    })

    return updated
  },

  /**
   * Get statistics (future, optional)
   * TODO: Implement analytics
   */
  async getStatistics() {
    // Placeholder for future implementation
    return {
      totalSpins: 0,
      totalRewards: 0,
      claimRate: 0,
      topRewards: [],
      topEmployees: []
    }
  }
}
