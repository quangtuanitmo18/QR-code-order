import {
    createDishCategoryController,
    deleteDishCategoryController,
    getAllDishCategoriesController,
    getDishCategoryByIdController,
    updateDishCategoryController
} from '@/controllers/dish-category.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
    CreateDishCategoryBody,
    CreateDishCategoryBodyType,
    CreateDishCategoryRes,
    CreateDishCategoryResType,
    DeleteDishCategoryRes,
    DeleteDishCategoryResType,
    DishCategoryIdParam,
    DishCategoryIdParamType,
    GetDishCategoriesRes,
    GetDishCategoriesResType,
    GetDishCategoryRes,
    GetDishCategoryResType,
    UpdateDishCategoryBody,
    UpdateDishCategoryBodyType,
    UpdateDishCategoryRes,
    UpdateDishCategoryResType
} from '@/schemaValidations/dish-category.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function dishCategoryRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /dish-categories — public, no auth required
  fastify.get<{ Reply: GetDishCategoriesResType }>(
    '/',
    {
      schema: {
        response: { 200: GetDishCategoriesRes }
      }
    },
    async (request, reply) => {
      const result = await getAllDishCategoriesController()
      reply.send({ message: 'Get dish categories successfully', data: result as GetDishCategoriesResType['data'] })
    }
  )

  // GET /dish-categories/:id — public
  fastify.get<{ Reply: GetDishCategoryResType; Params: DishCategoryIdParamType }>(
    '/:id',
    {
      schema: {
        response: { 200: GetDishCategoryRes },
        params: DishCategoryIdParam
      }
    },
    async (request, reply) => {
      const result = await getDishCategoryByIdController(request.params.id)
      reply.send({ message: 'Get dish category successfully', data: result as GetDishCategoryResType['data'] })
    }
  )

  // POST /dish-categories — Owner only
  fastify.post<{ Reply: CreateDishCategoryResType; Body: CreateDishCategoryBodyType }>(
    '/',
    {
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook]),
      schema: {
        response: { 201: CreateDishCategoryRes },
        body: CreateDishCategoryBody
      }
    },
    async (request, reply) => {
      const result = await createDishCategoryController(request.body)
      reply.status(201).send({
        message: 'Create dish category successfully',
        data: result as CreateDishCategoryResType['data']
      })
    }
  )

  // PUT /dish-categories/:id — Owner only
  fastify.put<{ Reply: UpdateDishCategoryResType; Params: DishCategoryIdParamType; Body: UpdateDishCategoryBodyType }>(
    '/:id',
    {
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook]),
      schema: {
        response: { 200: UpdateDishCategoryRes },
        params: DishCategoryIdParam,
        body: UpdateDishCategoryBody
      }
    },
    async (request, reply) => {
      const result = await updateDishCategoryController(request.params.id, request.body)
      reply.send({ message: 'Update dish category successfully', data: result as UpdateDishCategoryResType['data'] })
    }
  )

  // DELETE /dish-categories/:id — Owner only
  fastify.delete<{ Reply: DeleteDishCategoryResType; Params: DishCategoryIdParamType }>(
    '/:id',
    {
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook]),
      schema: {
        response: { 200: DeleteDishCategoryRes },
        params: DishCategoryIdParam
      }
    },
    async (request, reply) => {
      const result = await deleteDishCategoryController(request.params.id)
      reply.send({ message: 'Delete dish category successfully', data: result })
    }
  )
}
