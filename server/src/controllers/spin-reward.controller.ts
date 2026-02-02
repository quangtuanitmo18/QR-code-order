import {
  CreateSpinRewardBodyType,
  GetSpinRewardsQueryParamsType,
  ReorderRewardsBodyType,
  UpdateSpinRewardBodyType
} from '@/schemaValidations/spin-reward.schema'
import { spinRewardService } from '@/services/spin-reward.service'

export const getSpinRewardsController = async (query: GetSpinRewardsQueryParamsType) => {
  return await spinRewardService.getRewards({
    isActive: query.isActive
  })
}

export const getSpinRewardByIdController = async (id: number) => {
  return await spinRewardService.getRewardById(id)
}

export const createSpinRewardController = async (body: CreateSpinRewardBodyType) => {
  return await spinRewardService.createReward({
    name: body.name,
    description: body.description,
    type: body.type,
    value: body.value,
    probability: body.probability,
    color: body.color,
    icon: body.icon,
    isActive: body.isActive,
    order: body.order,
    maxQuantity: body.maxQuantity,
    eventId: body.eventId,
  })
}

export const updateSpinRewardController = async (id: number, body: UpdateSpinRewardBodyType) => {
  return await spinRewardService.updateReward(id, {
    name: body.name,
    description: body.description,
    type: body.type,
    value: body.value,
    probability: body.probability,
    color: body.color,
    icon: body.icon,
    isActive: body.isActive,
    order: body.order,
    maxQuantity: body.maxQuantity
  })
}

export const deleteSpinRewardController = async (id: number) => {
  return await spinRewardService.deleteReward(id)
}

export const reorderRewardsController = async (body: ReorderRewardsBodyType) => {
  return await spinRewardService.reorderRewards(body.rewards)
}

export const validateProbabilitiesController = async () => {
  return await spinRewardService.validateProbabilities()
}
