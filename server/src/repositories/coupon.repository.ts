import { CouponStatus } from '@/constants/type'
import prisma from '@/database'
import { Prisma } from '@prisma/client'

export interface CouponFilters {
  status?: string
  fromDate?: Date
  toDate?: Date
}

export const couponRepository = {
  async create(data: {
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
    return await prisma.coupon.create({
      data: {
        ...data,
        status: data.status ?? CouponStatus.Active
      }
    })
  },

  async findById(id: number) {
    return await prisma.coupon.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true, email: true } } }
    })
  },

  async findByCode(code: string) {
    return await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })
  },

  async findMany(filters: CouponFilters) {
    const where: Prisma.CouponWhereInput = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.fromDate || filters.toDate) {
      where.startDate = {}
      if (filters.fromDate) (where.startDate as Prisma.DateTimeFilter).gte = filters.fromDate
      if (filters.toDate) (where.startDate as Prisma.DateTimeFilter).lte = filters.toDate
    }

    return await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true, email: true } } }
    })
  },

  async update(
    id: number,
    data: {
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
    return await prisma.coupon.update({
      where: { id },
      data
    })
  },

  async delete(id: number) {
    return await prisma.coupon.delete({
      where: { id }
    })
  },

  /**
   * Atomic conditional increment for usageCount.
   * Returns number of rows affected (0 or 1).
   * Use within transaction for race-condition safety.
   */
  async incrementUsageCountIfWithinLimit(couponId: number): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE Coupon
      SET usageCount = usageCount + 1
      WHERE id = ${couponId}
        AND status = 'ACTIVE'
        AND (maxTotalUsage IS NULL OR usageCount < maxTotalUsage)
    `
    return result as number
  }
}

