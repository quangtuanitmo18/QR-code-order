import z from 'zod'

export const DishCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type DishCategoryType = z.TypeOf<typeof DishCategorySchema>

export const GetDishCategoriesRes = z.object({
  data: z.array(DishCategorySchema),
  message: z.string(),
})
export type GetDishCategoriesResType = z.TypeOf<typeof GetDishCategoriesRes>

export const GetDishCategoryRes = z.object({
  data: DishCategorySchema,
  message: z.string(),
})
export type GetDishCategoryResType = z.TypeOf<typeof GetDishCategoryRes>

export const CreateDishCategoryBody = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
})
export type CreateDishCategoryBodyType = z.TypeOf<typeof CreateDishCategoryBody>

export const UpdateDishCategoryBody = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).nullable().optional(),
})
export type UpdateDishCategoryBodyType = z.TypeOf<typeof UpdateDishCategoryBody>

export const CreateDishCategoryRes = z.object({
  data: DishCategorySchema,
  message: z.string(),
})
export type CreateDishCategoryResType = z.TypeOf<typeof CreateDishCategoryRes>

export const UpdateDishCategoryRes = z.object({
  data: DishCategorySchema,
  message: z.string(),
})
export type UpdateDishCategoryResType = z.TypeOf<typeof UpdateDishCategoryRes>

export const DeleteDishCategoryRes = z.object({
  data: z.object({ success: z.boolean() }),
  message: z.string(),
})
export type DeleteDishCategoryResType = z.TypeOf<typeof DeleteDishCategoryRes>
