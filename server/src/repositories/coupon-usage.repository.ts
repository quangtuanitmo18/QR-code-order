import prisma from '@/database'

export const couponUsageRepository = {
  async create(data: {
    couponId: number
    guestId?: number
    orderId?: number
    paymentId?: number
    discountAmount: number
  }) {
    return await prisma.couponUsage.create({
      data
    })
  },

  async countByCouponId(couponId: number) {
    return await prisma.couponUsage.count({
      where: { couponId }
    })
  },

  async countByCouponIdAndGuestId(couponId: number, guestId: number) {
    return await prisma.couponUsage.count({
      where: {
        couponId,
        guestId
      }
    })
  }
}


