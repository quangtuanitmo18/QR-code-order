import { paymentService } from '@/services/payment.service'
import Stripe from 'stripe'

// Create a payment (unified for all methods)
export const createPaymentController = async ({
  guestId,
  paymentMethod,
  note,
  ipAddr,
  paymentHandlerId,
  currency
}: {
  guestId: number
  paymentMethod: string
  note?: string | string[]
  ipAddr: string
  paymentHandlerId?: number
  currency?: string
}) => {
  return await paymentService.createPayment({
    guestId,
    paymentMethod,
    note,
    ipAddr,
    paymentHandlerId,
    currency
  })
}

// Verify VNPay payment and update
export const verifyVNPayPaymentController = async (query: any, paymentHandlerId?: number) => {
  return await paymentService.verifyVNPayPayment(query, paymentHandlerId)
}

// Verify Stripe Payment (called by webhook)
export const verifyStripePaymentController = async (event: Stripe.Event, paymentHandlerId?: number) => {
  return await paymentService.verifyStripePayment(event, paymentHandlerId)
}

// Verify YooKassa Payment (called by webhook)
export const verifyYooKassaPaymentController = async (notification: any, paymentHandlerId?: number) => {
  return await paymentService.verifyYooKassaPayment(notification, paymentHandlerId)
}

// Get payment list (for admin/manager)
export const getPaymentsController = async ({
  fromDate,
  toDate,
  status,
  paymentMethod
}: {
  fromDate?: Date
  toDate?: Date
  status?: string
  paymentMethod?: string
}) => {
  return await paymentService.getPayments({ fromDate, toDate, status, paymentMethod })
}

// Get payment detail
export const getPaymentDetailController = async (paymentId: number) => {
  return await paymentService.getPaymentDetail(paymentId)
}

// Get guest payments
export const getGuestPaymentsController = async (guestId: number) => {
  return await paymentService.getGuestPayments(guestId)
}
