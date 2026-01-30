import {
    CreateCouponBodyType,
    UpdateCouponBodyType,
    ValidateCouponBodyType
} from '@/schemaValidations/coupon.schema'
import { couponService } from '@/services/coupon.service'

export const getCouponsController = async (filters: {
  status?: string
  fromDate?: Date
  toDate?: Date
}) => {
  return await couponService.getCoupons(filters)
}

export const getCouponByIdController = async (id: number) => {
  return await couponService.getCouponById(id)
}

export const createCouponController = async (
  body: CreateCouponBodyType,
  createdById: number
) => {
  return await couponService.createCoupon({
    ...body,
    createdById
  })
}

export const updateCouponController = async (id: number, body: UpdateCouponBodyType) => {
  return await couponService.updateCoupon(id, body)
}

export const deleteCouponController = async (id: number) => {
  return await couponService.deleteCoupon(id)
}

export const validateCouponController = async (body: ValidateCouponBodyType) => {
  return await couponService.validate(body)
}


