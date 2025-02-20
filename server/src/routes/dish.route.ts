import {
  createDish,
  deleteDish,
  getDishDetail,
  getDishList,
  getDishListWithPagination,
  updateDish
} from '@/controllers/dish.controller'
import { pauseApiHook, requireEmployeeHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  CreateDishBody,
  CreateDishBodyType,
  DishListRes,
  DishListResType,
  DishListWithPaginationQuery,
  DishListWithPaginationQueryType,
  DishListWithPaginationRes,
  DishListWithPaginationResType,
  DishParams,
  DishParamsType,
  DishRes,
  DishResType,
  UpdateDishBody,
  UpdateDishBodyType
} from '@/schemaValidations/dish.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function dishRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get<{
    Reply: DishListResType
  }>(
    '/',
    {
      schema: {
        response: {
          200: DishListRes
        }
      }
    },
    async (request, reply) => {
      const dishs = await getDishList()
      reply.send({
        data: dishs as DishListResType['data'],
        message: 'Lấy danh sách món ăn thành công!'
      })
    }
  )

  fastify.get<{
    Reply: DishListWithPaginationResType
    Querystring: DishListWithPaginationQueryType
  }>(
    '/pagination',
    {
      schema: {
        response: {
          200: DishListWithPaginationRes
        },
        querystring: DishListWithPaginationQuery
      }
    },
    async (request, reply) => {
      const { page, limit } = request.query
      const data = await getDishListWithPagination(page, limit)
      reply.send({
        data: {
          items: data.items as DishListWithPaginationResType['data']['items'],
          totalItem: data.totalItem,
          totalPage: data.totalPage,
          page,
          limit
        },
        message: 'Lấy danh sách món ăn thành công!'
      })
    }
  )

  fastify.get<{
    Params: DishParamsType
    Reply: DishResType
  }>(
    '/:id',
    {
      schema: {
        params: DishParams,
        response: {
          200: DishRes
        }
      }
    },
    async (request, reply) => {
      const dish = await getDishDetail(request.params.id)
      reply.send({
        data: dish as DishResType['data'],
        message: 'Lấy thông tin món ăn thành công!'
      })
    }
  )

  fastify.post<{
    Body: CreateDishBodyType
    Reply: DishResType
  }>(
    '',
    {
      schema: {
        body: CreateDishBody,
        response: {
          200: DishRes
        }
      },
      // Login AND (Owner OR Employee)
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const dish = await createDish(request.body)
      reply.send({
        data: dish as DishResType['data'],
        message: 'Tạo món ăn thành công!'
      })
    }
  )

  fastify.put<{
    Params: DishParamsType
    Body: UpdateDishBodyType
    Reply: DishResType
  }>(
    '/:id',
    {
      schema: {
        params: DishParams,
        body: UpdateDishBody,
        response: {
          200: DishRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const dish = await updateDish(request.params.id, request.body)
      reply.send({
        data: dish as DishResType['data'],
        message: 'Cập nhật món ăn thành công!'
      })
    }
  )

  fastify.delete<{
    Params: DishParamsType
    Reply: DishResType
  }>(
    '/:id',
    {
      schema: {
        params: DishParams,
        response: {
          200: DishRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const result = await deleteDish(request.params.id)
      reply.send({
        message: 'Xóa món ăn thành công!',
        data: result as DishResType['data']
      })
    }
  )
}
