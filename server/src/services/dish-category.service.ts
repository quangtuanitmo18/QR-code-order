import { dishCategoryRepository } from '@/repositories/dish-category.repository'
import { StatusError } from '@/utils/errors'

export const dishCategoryService = {
  async getAllCategories() {
    return await dishCategoryRepository.findAll()
  },

  async getCategoryById(id: number) {
    const category = await dishCategoryRepository.findById(id)
    if (!category) throw new StatusError({ status: 404, message: 'Dish category not found' })
    return category
  },

  async createCategory(data: { name: string; description?: string | null }) {
    const existing = await dishCategoryRepository.findByName(data.name)
    if (existing) throw new StatusError({ status: 409, message: `Category '${data.name}' already exists` })
    return await dishCategoryRepository.create(data)
  },

  async updateCategory(id: number, data: { name?: string; description?: string | null }) {
    await dishCategoryService.getCategoryById(id) // throws 404 if not found
    if (data.name) {
      const existing = await dishCategoryRepository.findByName(data.name)
      if (existing && existing.id !== id) {
        throw new StatusError({ status: 409, message: `Category '${data.name}' already exists` })
      }
    }
    return await dishCategoryRepository.update(id, data)
  },

  async deleteCategory(id: number) {
    await dishCategoryService.getCategoryById(id) // throws 404 if not found
    return await dishCategoryRepository.delete(id)
  }
}
