import { dishService } from '@/services/dish.service'
import { CreateDishBodyType, UpdateDishBodyType } from '@/schemaValidations/dish.schema'

export const getDishList = () => {
  return dishService.getAllDishes()
}

export const getDishListWithPagination = async (page: number, limit: number) => {
  return await dishService.getDishesWithPagination(page, limit)
}

export const getDishDetail = (id: number) => {
  return dishService.getDishById(id)
}

export const createDish = (data: CreateDishBodyType) => {
  return dishService.createDish(data)
}

export const updateDish = (id: number, data: UpdateDishBodyType) => {
  return dishService.updateDish(id, data)
}

export const deleteDish = (id: number) => {
  return dishService.deleteDish(id)
}
