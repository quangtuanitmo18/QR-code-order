import { ManagerRoom } from '@/constants/type'
import prisma from '@/database'
import { employeeSpinRepository } from '@/repositories/employee-spin.repository'
import { EntityError } from '@/utils/errors'
import { FastifyInstance } from 'fastify'

/**
 * Calculate reward using weighted probability
 * @param rewards - Array of available rewards (should be pre-filtered)
 * @returns Selected reward
 */
function calculateReward(
  rewards: Array<{
    id: number
    probability: number
    maxQuantity: number | null
    currentQuantity: number
    isActive: boolean
    order?: number // Optional, not used in calculation but included for consistency
  }>
) {
  if (rewards.length === 0) {
    throw new Error('No rewards available')
  }

  // Filter out exhausted rewards (defensive check)
  const availableRewards = rewards.filter(
    (r) => r.isActive && (r.maxQuantity === null || r.currentQuantity < r.maxQuantity)
  )

  if (availableRewards.length === 0) {
    throw new Error('All rewards are exhausted')
  }

  // Calculate total weight (normalize if needed)
  const totalWeight = availableRewards.reduce((sum, r) => sum + r.probability, 0)

  if (totalWeight <= 0) {
    // Fallback to equal probability if all probabilities are 0
    const random = Math.random()
    const index = Math.floor(random * availableRewards.length)
    return availableRewards[index]
  }

  // Generate random number
  let random = Math.random() * totalWeight

  // Find reward based on weight
  for (const reward of availableRewards) {
    random -= reward.probability
    if (random <= 0) {
      return reward
    }
  }

  // Fallback to last reward (shouldn't happen with proper normalization)
  return availableRewards[availableRewards.length - 1]
}

export const employeeSpinService = {
  /**
   * Calculate reward using weighted probability
   */
  calculateReward,

  /**
   * Execute spin with atomic operations and retry mechanism
   * @throws {EntityError} if spin not found, unauthorized, or already executed
   */
  async executeSpin(spinId: number, employeeId: number, fastify: FastifyInstance) {
    const MAX_RETRIES = 3
    let retryCount = 0

    while (retryCount < MAX_RETRIES) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. Lock and verify spin exists and belongs to employee
          const spin = await tx.employeeSpin.findUnique({
            where: { id: spinId },
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          })

          if (!spin || spin.employeeId !== employeeId) {
            throw new EntityError([{ field: 'spinId', message: 'Spin not found or unauthorized' }])
          }

          if (spin.status !== 'PENDING') {
            throw new EntityError([{ field: 'spinId', message: 'Spin already executed' }])
          }

          // 2. Get available rewards (active and not exhausted)
          // Use raw query within transaction to get available rewards
          const rewards = await tx.$queryRaw<
            Array<{
              id: number
              probability: number
              maxQuantity: number | null
              currentQuantity: number
              isActive: boolean
              order: number
            }>
          >`
            SELECT id, probability, maxQuantity, currentQuantity, isActive, "order"
            FROM SpinReward
            WHERE isActive = 1
              AND (maxQuantity IS NULL OR currentQuantity < maxQuantity)
            ORDER BY "order" ASC
          `

          if (rewards.length === 0) {
            throw new EntityError([{ field: 'rewards', message: 'No active rewards available' }])
          }

          // 3. Calculate reward using weighted probability
          const selectedReward = calculateReward(rewards)

          // 4. ATOMIC UPDATE: Increment quantity if reward is limited
          if (selectedReward.maxQuantity !== null) {
            const rowsAffected = await tx.$executeRaw`
              UPDATE SpinReward
              SET currentQuantity = currentQuantity + 1,
                  version = version + 1,
                  updatedAt = CURRENT_TIMESTAMP
              WHERE id = ${selectedReward.id}
                AND isActive = 1
                AND currentQuantity < maxQuantity
            `

            // If update failed, reward was exhausted by another concurrent spin
            if (Number(rowsAffected) === 0) {
              // Retry with remaining rewards (exclude exhausted one)
              const remainingRewards = rewards.filter((r) => r.id !== selectedReward.id)
              if (remainingRewards.length === 0) {
                throw new EntityError([{ field: 'rewards', message: 'All rewards are exhausted' }])
              }
              // Throw special error to trigger retry
              throw new Error('REWARD_EXHAUSTED')
            }
          } else {
            // Unlimited reward, no need to update quantity
            // But still update version for optimistic locking
            await tx.spinReward.update({
              where: { id: selectedReward.id },
              data: { version: { increment: 1 } }
            })
          }

          // 5. Update spin with reward (atomic)
          const updatedSpin = await tx.employeeSpin.update({
            where: { id: spinId },
            data: {
              rewardId: selectedReward.id
              // Status remains PENDING until claimed
            },
            include: {
              reward: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  value: true,
                  color: true,
                  icon: true
                }
              },
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              },
              event: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  startDate: true,
                  endDate: true,
                  isActive: true
                }
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          })

          return updatedSpin
        })

        // 6. Emit WebSocket event to admin dashboard
        if (fastify.io) {
          fastify.io.to(ManagerRoom).emit('employee-spin-won', {
            employeeSpin: result,
            employee: result.employee,
            reward: result.reward
          })
        }

        return result
      } catch (error: any) {
        // Handle retry for exhausted rewards
        if (error.message === 'REWARD_EXHAUSTED' && retryCount < MAX_RETRIES - 1) {
          retryCount++
          // Exponential backoff: wait 50ms, 100ms, 200ms
          await new Promise((resolve) => setTimeout(resolve, 50 * Math.pow(2, retryCount - 1)))
          continue // Retry
        }
        // Re-throw other errors
        throw error
      }
    }

    // Should never reach here, but TypeScript needs it
    throw new EntityError([{ field: 'rewards', message: 'Failed to execute spin after retries' }])
  },

  /**
   * Claim reward
   * @throws {EntityError} if spin not found, unauthorized, already claimed, or expired
   */
  async claimReward(spinId: number, employeeId: number) {
    const spin = await employeeSpinRepository.findById(spinId)

    if (!spin) {
      throw new EntityError([{ field: 'spinId', message: 'Spin not found' }])
    }

    if (spin.employeeId !== employeeId) {
      throw new EntityError([{ field: 'spinId', message: 'Unauthorized' }])
    }

    if (spin.status !== 'PENDING') {
      throw new EntityError([{ field: 'spinId', message: 'Reward already claimed or expired' }])
    }

    // Check expiration
    if (spin.expiredAt) {
      const now = new Date()
      if (now > spin.expiredAt) {
        // Update status to EXPIRED
        await employeeSpinRepository.update(spinId, { status: 'EXPIRED' })
        throw new EntityError([{ field: 'spinId', message: 'Reward has expired' }])
      }
    }

    // Update status to CLAIMED
    const updated = await employeeSpinRepository.update(spinId, {
      status: 'CLAIMED',
      claimedAt: new Date()
    })

    return updated
  },

  /**
   * Get employee spins with filters
   */
  async getEmployeeSpins(employeeId: number, filters?: { status?: string; fromDate?: Date; toDate?: Date; eventId?: number }) {
    return await employeeSpinRepository.findByEmployeeId(employeeId, filters)
  },

  /**
   * Get pending rewards (unclaimed, not expired)
   */
  async getPendingRewards(employeeId: number, eventId?: number) {
    return await employeeSpinRepository.findPendingByEmployeeId(employeeId, eventId)
  }
}
