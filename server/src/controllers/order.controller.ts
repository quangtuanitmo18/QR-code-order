import { PaymentMethod } from '@/constants/type'
import { CreateOrdersBodyType, UpdateOrderBodyType } from '@/schemaValidations/order.schema'
import { orderService } from '@/services/order.service'

export const createOrdersController = async (orderHandlerId: number, body: CreateOrdersBodyType) => {
  return await orderService.createOrders(orderHandlerId, body)
}

export const getOrdersController = async ({ fromDate, toDate }: { fromDate?: Date; toDate?: Date }) => {
  return await orderService.getOrders(fromDate, toDate)
}

// Controller pay orders by guestId
export const payOrdersController = async ({
  guestId,
  orderHandlerId,
  paymentMethod = PaymentMethod.Cash,
  note,
  couponId
}: {
  guestId: number
  orderHandlerId: number
  paymentMethod?: string
  note?: string
  couponId?: number
}) => {
  return await orderService.payOrders({
    guestId,
    paymentMethod,
    note,
    currency: 'USD',
    ipAddr: '127.0.0.1',
    paymentHandlerId: orderHandlerId,
    couponId
  })
}

export const getOrderDetailController = (orderId: number) => {
  return orderService.getOrderDetail(orderId)
}

export const updateOrderController = async (
  orderId: number,
  body: UpdateOrderBodyType & { orderHandlerId: number }
) => {
  return await orderService.updateOrder(orderId, body)
}
