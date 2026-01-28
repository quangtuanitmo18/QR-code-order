import { dishRepository } from '@/repositories/dish.repository'
import { CreateDishBodyType, UpdateDishBodyType } from '@/schemaValidations/dish.schema'

export const dishService = {
  // Get all dishes
  async getAllDishes() {
    return await dishRepository.findAll()
  },

  // Get dishes with pagination
  async getDishesWithPagination(page: number, limit: number) {
    const { items, totalItem, totalPage } = await dishRepository.findWithPagination(page, limit)
    return {
      items,
      totalItem,
      page,
      limit,
      totalPage
    }
  },

  // Get dish by ID
  async getDishById(id: number) {
    return await dishRepository.findById(id)
  },

  // Create new dish
  async createDish(data: CreateDishBodyType) {
    return await dishRepository.create(data)
  },

  // Update dish
  async updateDish(id: number, data: UpdateDishBodyType) {
    return await dishRepository.update(id, data)
  },

  // Delete dish
  async deleteDish(id: number) {
    return await dishRepository.delete(id)
  },

  // Create dish snapshot (used when creating orders)
  async createDishSnapshot(dishId: number) {
    const dish = await dishRepository.findById(dishId)
    return await dishRepository.createSnapshot({
      name: dish.name,
      price: dish.price,
      description: dish.description,
      image: dish.image,
      status: dish.status,
      dishId: dish.id
    })
  },

  // Get dish snapshot by ID
  async getDishSnapshotById(id: number) {
    return await dishRepository.findSnapshotById(id)
  },

  // Get dish snapshots by dish ID
  async getDishSnapshotsByDishId(dishId: number) {
    return await dishRepository.findSnapshotsByDishId(dishId)
  }
}
