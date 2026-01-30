import http from '@/lib/http';
import {
    CouponListResType,
    CouponResType,
    CreateCouponBodyType,
    UpdateCouponBodyType,
    ValidateCouponBodyType,
    ValidateCouponResType,
} from '@/schemaValidations/coupon.schema';

const couponApiRequest = {
  list: (params?: { status?: string; fromDate?: Date; toDate?: Date }) =>
    http.get<CouponListResType>('coupons', {
      params,
      next: { tags: ['coupons'] },
    }),
  add: (body: CreateCouponBodyType) => http.post<CouponResType>('coupons', body),
  getCoupon: (id: number) => http.get<CouponResType>(`coupons/${id}`),
  updateCoupon: (id: number, body: UpdateCouponBodyType) =>
    http.put<CouponResType>(`coupons/${id}`, body),
  deleteCoupon: (id: number) => http.delete<CouponResType>(`coupons/${id}`),
  validate: (body: ValidateCouponBodyType) =>
    http.post<ValidateCouponResType>('coupons/validate', body),
}

export default couponApiRequest


