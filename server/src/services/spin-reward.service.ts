import { spinRewardRepository } from '@/repositories/spin-reward.repository'
import { EntityError } from '@/utils/errors'
import prisma from '@/database'

export const spinRewardService = {
  /**
   * Get active rewards for display on spin wheel
   * @param eventId Optional: filter by specific event
   */
  async getActiveRewards(eventId?: number) {
    const rewards = await spinRewardRepository.findActive(eventId)
    return rewards.map((reward) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      probability: reward.probability,
      color: reward.color,
      icon: reward.icon,
      order: reward.order
    }))
  },

  /**
   * Get available rewards (active and not exhausted) for spin calculation
   * @param eventId Optional: filter by specific event
   */
  async getAvailableRewards(eventId?: number) {
    return await spinRewardRepository.findAvailable(eventId)
  },

  /**
   * Get all rewards (admin)
   */
  async getRewards(filters?: { isActive?: boolean }) {
    const rewards = await spinRewardRepository.findAll(filters)
    return rewards.map((reward) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      probability: reward.probability,
      color: reward.color,
      icon: reward.icon,
      isActive: reward.isActive,
      order: reward.order,
      maxQuantity: reward.maxQuantity,
      currentQuantity: reward.currentQuantity,
      version: reward.version,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt
    }))
  },

  /**
   * Get reward by ID
   * @throws {EntityError} if not found
   */
  async getRewardById(id: number) {
    const reward = await spinRewardRepository.findById(id)
    if (!reward) {
      throw new EntityError([{ field: 'id', message: 'Reward not found' }])
    }
    return reward
  },

  /**
   * Create reward
   */
  async createReward(data: {
    name: string
    description?: string | null
    type: string
    value?: string | null
    probability: number
    color: string
    icon?: string | null
    isActive?: boolean
    order: number
    maxQuantity?: number | null
  }) {
    const reward = await spinRewardRepository.create({
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      probability: data.probability,
      color: data.color,
      icon: data.icon,
      isActive: data.isActive,
      order: data.order,
      maxQuantity: data.maxQuantity,
      eventId: data.eventId
    })
    return reward
  },

  /**
   * Update reward
   * @throws {EntityError} if not found
   */
  async updateReward(
    id: number,
    data: {
      name?: string
      description?: string | null
      type?: string
      value?: string | null
      probability?: number
      color?: string
      icon?: string | null
      isActive?: boolean
      order?: number
      maxQuantity?: number | null
    }
  ) {
    const existing = await spinRewardRepository.findById(id)
    if (!existing) {
      throw new EntityError([{ field: 'id', message: 'Reward not found' }])
    }

    const updated = await spinRewardRepository.update(id, data)
    return updated
  },

  /**
   * Delete reward (soft delete)
   * @throws {EntityError} if not found
   */
  async deleteReward(id: number) {
    const reward = await spinRewardRepository.findById(id)
    if (!reward) {
      throw new EntityError([{ field: 'id', message: 'Reward not found' }])
    }

    await spinRewardRepository.delete(id)
    return { success: true }
  },

  /**
   * Reorder rewards
   */
  async reorderRewards(orders: { id: number; order: number }[]) {
    await spinRewardRepository.updateOrders(orders)
    return { success: true }
  },

  /**
   * Validate that probabilities sum to 1.0 (warning, not error)
   * Returns validation result with total
   */
  async validateProbabilities(): Promise<{ isValid: boolean; total: number }> {
    const activeRewards = await spinRewardRepository.findActive()
    const total = activeRewards.reduce((sum, reward) => sum + reward.probability, 0)
    const isValid = Math.abs(total - 1.0) < 0.001 // Allow small floating point errors

    return { isValid, total }
  },

  /**
   * Atomic increment quantity (returns success/failure)
   */
  async incrementQuantityAtomic(id: number): Promise<boolean> {
    const rowsAffected = await spinRewardRepository.incrementQuantityAtomic(id)
    return rowsAffected > 0
  }
}
