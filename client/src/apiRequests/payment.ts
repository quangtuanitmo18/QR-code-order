import http from '@/lib/http'
import { GetPaymentDetailResType, GetPaymentsResType } from '@/schemaValidations/payment.schema'

const paymentApiRequest = {
  // For admin/manager
  getPaymentList: (params?: {
    fromDate?: Date
    toDate?: Date
    status?: string
    paymentMethod?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate.toISOString())
    if (params?.toDate) queryParams.append('toDate', params.toDate.toISOString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod)

    return http.get<GetPaymentsResType>(`/payment?${queryParams.toString()}`)
  },

  getPaymentDetail: (paymentId: number) =>
    http.get<GetPaymentDetailResType>(`/payment/${paymentId}`),
}

export default paymentApiRequest
