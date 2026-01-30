import {
    createCouponController,
    deleteCouponController,
    getCouponByIdController,
    getCouponsController,
    updateCouponController,
    validateCouponController
} from '@/controllers/coupon.controller'
import { requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
    CouponParam,
    CouponParamType,
    CreateCouponBody,
    CreateCouponBodyType,
    CreateCouponRes,
    CreateCouponResType,
    DeleteCouponRes,
    DeleteCouponResType,
    GetCouponRes,
    GetCouponResType,
    GetCouponsQueryParams,
    GetCouponsQueryParamsType,
    GetCouponsRes,
    GetCouponsResType,
    UpdateCouponBody,
    UpdateCouponBodyType,
    UpdateCouponRes,
    UpdateCouponResType,
    ValidateCouponBody,
    ValidateCouponBodyType,
    ValidateCouponRes,
    ValidateCouponResType
} from '@/schemaValidations/coupon.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function couponRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Validate - Employee + Guest (requireLoginedHook only)
  fastify.post<{
    Body: ValidateCouponBodyType
    Reply: ValidateCouponResType
  }>(
    '/validate',
    {
      schema: {
        response: {
          200: ValidateCouponRes
        },
        body: ValidateCouponBody
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const result = await validateCouponController(request.body)
      reply.send(result)
    }
  )

  // CRUD - Owner only
  fastify.get<{
    Reply: GetCouponsResType
    Querystring: GetCouponsQueryParamsType
  }>(
    '/',
    {
      schema: {
        response: {
          200: GetCouponsRes
        },
        querystring: GetCouponsQueryParams
      },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const coupons = await getCouponsController({
        status: request.query.status,
        fromDate: request.query.fromDate,
        toDate: request.query.toDate
      })
      reply.send({
        message: 'Get coupons successfully',
        data: coupons as GetCouponsResType['data']
      })
    }
  )

  fastify.get<{
    Reply: GetCouponResType
    Params: CouponParamType
  }>(
    '/:id',
    {
      schema: {
        response: {
          200: GetCouponRes
        },
        params: CouponParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const coupon = await getCouponByIdController(request.params.id)
      reply.send({
        message: 'Get coupon successfully',
        data: coupon as GetCouponResType['data']
      })
    }
  )

  fastify.post<{
    Body: CreateCouponBodyType
    Reply: CreateCouponResType
  }>(
    '/',
    {
      schema: {
        response: {
          200: CreateCouponRes
        },
        body: CreateCouponBody
      },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const createdById = request.decodedAccessToken?.userId as number
      const coupon = await createCouponController(request.body, createdById)
      reply.send({
        message: 'Create coupon successfully',
        data: coupon as CreateCouponResType['data']
      })
    }
  )

  fastify.put<{
    Body: UpdateCouponBodyType
    Reply: UpdateCouponResType
    Params: CouponParamType
  }>(
    '/:id',
    {
      schema: {
        response: {
          200: UpdateCouponRes
        },
        body: UpdateCouponBody,
        params: CouponParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const coupon = await updateCouponController(request.params.id, request.body)
      reply.send({
        message: 'Update coupon successfully',
        data: coupon as UpdateCouponResType['data']
      })
    }
  )

  fastify.delete<{
    Reply: DeleteCouponResType
    Params: CouponParamType
  }>(
    '/:id',
    {
      schema: {
        response: {
          200: DeleteCouponRes
        },
        params: CouponParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook])
    },
    async (request, reply) => {
      const coupon = await deleteCouponController(request.params.id)
      reply.send({
        message: 'Delete coupon successfully',
        data: coupon as DeleteCouponResType['data']
      })
    }
  )
}

