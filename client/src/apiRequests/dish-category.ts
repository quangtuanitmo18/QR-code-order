import http from '@/lib/http'
import {
  CreateDishCategoryBodyType,
  CreateDishCategoryResType,
  DeleteDishCategoryResType,
  GetDishCategoriesResType,
  GetDishCategoryResType,
  UpdateDishCategoryBodyType,
  UpdateDishCategoryResType,
} from '@/schemaValidations/dish-category.schema'

export const dishCategoryApiRequest = {
  getCategories: () => http.get<GetDishCategoriesResType>('/dish-categories'),
  getCategoryById: (id: number) => http.get<GetDishCategoryResType>(`/dish-categories/${id}`),
  createCategory: (body: CreateDishCategoryBodyType) =>
    http.post<CreateDishCategoryResType>('/dish-categories', body),
  updateCategory: (id: number, body: UpdateDishCategoryBodyType) =>
    http.put<UpdateDishCategoryResType>(`/dish-categories/${id}`, body),
  deleteCategory: (id: number) => http.delete<DeleteDishCategoryResType>(`/dish-categories/${id}`),
}

export default dishCategoryApiRequest
