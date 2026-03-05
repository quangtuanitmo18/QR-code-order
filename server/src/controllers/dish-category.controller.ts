import { CreateDishCategoryBodyType, UpdateDishCategoryBodyType } from '@/schemaValidations/dish-category.schema'
import { dishCategoryService } from '@/services/dish-category.service'

export const getAllDishCategoriesController = async () => {
  return await dishCategoryService.getAllCategories()
}

export const getDishCategoryByIdController = async (id: number) => {
  return await dishCategoryService.getCategoryById(id)
}

export const createDishCategoryController = async (body: CreateDishCategoryBodyType) => {
  return await dishCategoryService.createCategory({
    name: body.name,
    description: body.description ?? null
  })
}

export const updateDishCategoryController = async (id: number, body: UpdateDishCategoryBodyType) => {
  return await dishCategoryService.updateCategory(id, {
    name: body.name,
    description: body.description
  })
}

export const deleteDishCategoryController = async (id: number) => {
  await dishCategoryService.deleteCategory(id)
  return { success: true }
}
