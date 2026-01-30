import { PrismaErrorCode } from '@/constants/error-reference'
import { CouponDiscountType, CouponStatus } from '@/constants/type'
import { couponUsageRepository } from '@/repositories/coupon-usage.repository'
import { couponRepository } from '@/repositories/coupon.repository'
import { EntityError, isPrismaClientKnownRequestError } from '@/utils/errors'

export type ValidateCouponParams = {
  code: string
  orderTotal: number
  dishIds?: number[]
  guestId?: number
}

export type ValidateCouponResult =
  | { valid: true; coupon: { id: number; code: string; discountType: string; discountValue: number }; discountAmount: number; finalAmount: number }
  | { valid: false; message: string }

export const couponService = {
  /**
   * Validate coupon without applying (for preview).
   * Does NOT increment usageCount - that happens at order/payment creation.
   */
  async validate(params: ValidateCouponParams): Promise<ValidateCouponResult> {
    const { code, orderTotal, dishIds = [], guestId } = params

    const coupon = await couponRepository.findByCode(code)
    if (!coupon) {
      return { valid: false, message: 'Mã giảm giá không tồn tại' }
    }

    if (coupon.status !== CouponStatus.Active) {
      return { valid: false, message: 'Mã giảm giá không còn hiệu lực' }
    }

    const now = new Date()
    if (now < coupon.startDate) {
      return { valid: false, message: 'Mã giảm giá chưa có hiệu lực' }
    }
    if (now > coupon.endDate) {
      return { valid: false, message: 'Mã đã hết hạn' }
    }

    if (coupon.maxTotalUsage !== null && coupon.usageCount >= coupon.maxTotalUsage) {
      return { valid: false, message: 'Mã đã hết lượt dùng' }
    }

    if (guestId !== undefined && coupon.maxUsagePerGuest !== null) {
      const usageCount = await couponUsageRepository.countByCouponIdAndGuestId(coupon.id, guestId)
      if (usageCount >= coupon.maxUsagePerGuest) {
        return { valid: false, message: 'Bạn đã sử dụng mã này đủ số lần' }
      }
    }

    if (coupon.minOrderAmount !== null && orderTotal < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `Đơn hàng chưa đủ điều kiện (tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')} VND)`
      }
    }

    if (coupon.applicableDishIds) {
      try {
        const applicableIds = JSON.parse(coupon.applicableDishIds) as number[]
        if (Array.isArray(applicableIds) && applicableIds.length > 0) {
          const hasApplicableDish = dishIds.some((id) => applicableIds.includes(id))
          if (!hasApplicableDish) {
            return { valid: false, message: 'Mã không áp dụng cho món trong đơn' }
          }
        }
      } catch {
        // Invalid JSON - treat as no restriction
      }
    }

    let discountAmount: number
    if (coupon.discountType === CouponDiscountType.Percentage) {
      discountAmount = Math.min(Math.floor((orderTotal * coupon.discountValue) / 100), orderTotal)
    } else {
      discountAmount = Math.min(coupon.discountValue, orderTotal)
    }

    const finalAmount = orderTotal - discountAmount

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount,
      finalAmount
    }
  },

  async getCoupons(filters: { status?: string; fromDate?: Date; toDate?: Date }) {
    return await couponRepository.findMany(filters)
  },

  async getCouponById(id: number) {
    return await couponRepository.findById(id)
  },

  async createCoupon(data: {
    code: string
    discountType: string
    discountValue: number
    minOrderAmount?: number
    applicableDishIds?: string
    maxTotalUsage?: number
    maxUsagePerGuest?: number
    startDate: Date
    endDate: Date
    status?: string
    createdById: number
  }) {
    try {
      const code = data.code.toUpperCase().trim()
      return await couponRepository.create({
        ...data,
        code
      })
    } catch (error: unknown) {
      if (isPrismaClientKnownRequestError(error)) {
        if (error.code === PrismaErrorCode.UniqueConstraintViolation) {
          throw new EntityError([{ field: 'code', message: 'Mã giảm giá đã tồn tại' }])
        }
      }
      throw error
    }
  },

  async updateCoupon(
    id: number,
    data: {
      code?: string
      discountType?: string
      discountValue?: number
      minOrderAmount?: number
      applicableDishIds?: string
      maxTotalUsage?: number
      maxUsagePerGuest?: number
      startDate?: Date
      endDate?: Date
      status?: string
    }
  ) {
    const coupon = await couponRepository.findById(id)
    if (!coupon) {
      throw new EntityError([{ field: 'id', message: 'Mã giảm giá không tồn tại' }])
    }

    const usageCount = await couponUsageRepository.countByCouponId(id)
    if (usageCount > 0 && data.code !== undefined && data.code.toUpperCase() !== coupon.code) {
      throw new EntityError([{ field: 'code', message: 'Không thể sửa mã khi đã có lượt sử dụng' }])
    }

    const { code: _code, ...updateData } = data
    if (data.endDate && new Date(data.endDate) < new Date()) {
      ;(updateData as { status?: string }).status = CouponStatus.Expired
    }

    return await couponRepository.update(id, updateData)
  },

  async deleteCoupon(id: number) {
    const coupon = await couponRepository.findById(id)
    if (!coupon) {
      throw new EntityError([{ field: 'id', message: 'Mã giảm giá không tồn tại' }])
    }
    return await couponRepository.delete(id)
  }
}

