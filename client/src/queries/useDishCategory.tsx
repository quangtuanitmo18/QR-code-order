import dishCategoryApiRequest from '@/apiRequests/dish-category'
import { UpdateDishCategoryBodyType } from '@/schemaValidations/dish-category.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useDishCategoryListQuery = () =>
  useQuery({
    queryKey: ['dish-categories'],
    queryFn: dishCategoryApiRequest.getCategories
  })

export const useCreateDishCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dishCategoryApiRequest.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dish-categories'] })
    }
  })
}

export const useUpdateDishCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateDishCategoryBodyType & { id: number }) =>
      dishCategoryApiRequest.updateCategory(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dish-categories'] })
    }
  })
}

export const useDeleteDishCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dishCategoryApiRequest.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dish-categories'] })
    }
  })
}
