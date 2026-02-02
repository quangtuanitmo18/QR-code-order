import prisma from '@/database';
import { employeeSpinRepository } from '@/repositories/employee-spin.repository';
import { EntityError } from '@/utils/errors';

export const adminSpinService = {
  /**
   * Grant spin to employee
   * @throws {EntityError} if employee not found or event not found (if eventId provided)
   */
  async grantSpin(data: { employeeId: number; adminId: number; eventId?: number | null; notes?: string | null; expiredAt?: Date | null }) {
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

    // Verify event exists if eventId is provided
    if (data.eventId) {
      const event = await prisma.spinEvent.findUnique({
        where: { id: data.eventId },
        select: { id: true }
      })

      if (!event) {
        throw new EntityError([{ field: 'eventId', message: 'Event not found' }])
      }
    }

    // Create spin with status PENDING (rewardId will be set when spin is executed)
    const spin = await employeeSpinRepository.create({
      employeeId: data.employeeId,
      rewardId: null, // Will be set when spin is executed
      eventId: data.eventId ?? null,
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
