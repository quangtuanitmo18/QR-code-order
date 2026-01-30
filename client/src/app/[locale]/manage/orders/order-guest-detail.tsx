import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderStatus } from '@/constants/type'
import {
    OrderStatusIcon,
    formatCurrency,
    formatDateTimeToLocaleString,
    formatDateTimeToTimeString,
    getOrderStatus,
    handleErrorApi,
} from '@/lib/utils'
import { usePayForGuestMutation } from '@/queries/useOrder'
import { GetOrdersResType, PayGuestOrdersResType } from '@/schemaValidations/order.schema'
import Image from 'next/image'
import { Fragment } from 'react'

type Guest = GetOrdersResType['data'][0]['guest']
type Orders = GetOrdersResType['data']
export default function OrderGuestDetail({
  guest,
  orders,
  onPaySuccess,
}: {
  guest: Guest
  orders: Orders
  onPaySuccess?: (data: PayGuestOrdersResType) => void
}) {
  const unpaidOrders = guest
    ? orders.filter(
        (order) => order.status !== OrderStatus.Paid && order.status !== OrderStatus.Rejected
      )
    : []
  const paidOrders = guest ? orders.filter((order) => order.status === OrderStatus.Paid) : []
  const payForGuestMutation = usePayForGuestMutation()

  // Flatten orders to line items for display
  const orderLines = orders.flatMap((order) =>
    order.items.map((item) => ({
      order,
      item,
    }))
  )

  const pay = async () => {
    if (payForGuestMutation.isPending || !guest) return
    try {
      const result = await payForGuestMutation.mutateAsync({
        guestId: guest.id,
      })
      onPaySuccess && onPaySuccess(result.payload)
    } catch (error) {
      handleErrorApi({
        error,
      })
    }
  }
  return (
    <div className="space-y-2 text-sm">
      {guest && (
        <Fragment>
          <div className="space-x-1">
            <span className="font-semibold">Name:</span>
            <span>{guest.name}</span>
            <span className="font-semibold">(#{guest.id})</span>
            <span>|</span>
            <span className="font-semibold">Table:</span>
            <span>{guest.tableNumber}</span>
          </div>
          <div className="space-x-1">
            <span className="font-semibold">Registration Date:</span>

            <span>{formatDateTimeToLocaleString(guest.createdAt)}</span>
          </div>
        </Fragment>
      )}

      <div className="space-y-1">
        <div className="font-semibold">Order:</div>
        {orderLines.map(({ order, item }, index) => {
          return (
            <div key={item.id} className="flex items-center gap-2 text-xs">
              <span className="w-[10px]">{index + 1}</span>
              <span title={getOrderStatus(order.status)}>
                {order.status === OrderStatus.Pending && (
                  <OrderStatusIcon.Pending className="h-4 w-4" />
                )}
                {order.status === OrderStatus.Processing && (
                  <OrderStatusIcon.Processing className="h-4 w-4" />
                )}
                {order.status === OrderStatus.Rejected && (
                  <OrderStatusIcon.Rejected className="h-4 w-4 text-red-400" />
                )}
                {order.status === OrderStatus.Delivered && (
                  <OrderStatusIcon.Delivered className="h-4 w-4" />
                )}
                {order.status === OrderStatus.Paid && (
                  <OrderStatusIcon.Paid className="h-4 w-4 text-yellow-400" />
                )}
              </span>
              <Image
                src={item.dishSnapshot.image}
                alt={item.dishSnapshot.name}
                title={item.dishSnapshot.name}
                width={30}
                height={30}
                unoptimized
                className="h-[30px] w-[30px] rounded object-cover"
              />
              <span className="w-[70px] truncate sm:w-[100px]" title={item.dishSnapshot.name}>
                {item.dishSnapshot.name}
              </span>
              <span className="font-semibold" title={`Total: ${item.quantity}`}>
                x{item.quantity}
              </span>
              <span className="italic">{formatCurrency(item.totalPrice)}</span>
              <span
                className="hidden sm:inline"
                title={`Create: ${formatDateTimeToLocaleString(
                  order.createdAt
                )} | Edit: ${formatDateTimeToLocaleString(order.updatedAt)}
          `}
              >
                {formatDateTimeToLocaleString(order.createdAt)}
              </span>
              <span
                className="sm:hidden"
                title={`Create: ${formatDateTimeToLocaleString(
                  order.createdAt
                )} | Edit: ${formatDateTimeToLocaleString(order.updatedAt)}
          `}
              >
                {formatDateTimeToTimeString(order.createdAt)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="space-x-1">
        <span className="font-semibold">Unpaid:</span>
        <Badge>
          <div className="space-y-0.5">
            {unpaidOrders.some((o) => o.discountAmount && o.discountAmount > 0) && (
              <div className="text-xs text-green-600 dark:text-green-400">
                -{formatCurrency(
                  unpaidOrders.reduce((acc, order) => acc + (order.discountAmount || 0), 0)
                )}{' '}
                discount
              </div>
            )}
            <span>
              {formatCurrency(
                unpaidOrders.reduce((acc, order) => {
                  return acc + order.totalAmount - (order.discountAmount || 0)
                }, 0)
              )}
            </span>
          </div>
        </Badge>
      </div>
      <div className="space-x-1">
        <span className="font-semibold">Paid:</span>
        <Badge variant={'outline'}>
          <div className="space-y-0.5">
            {paidOrders.some((o) => o.discountAmount && o.discountAmount > 0) && (
              <div className="text-xs text-green-600 dark:text-green-400">
                -{formatCurrency(
                  paidOrders.reduce((acc, order) => acc + (order.discountAmount || 0), 0)
                )}{' '}
                discount
              </div>
            )}
            <span>
              {formatCurrency(
                paidOrders.reduce((acc, order) => {
                  return acc + order.totalAmount - (order.discountAmount || 0)
                }, 0)
              )}
            </span>
          </div>
        </Badge>
      </div>

      <div>
        <Button
          className="w-full"
          size={'sm'}
          variant={'secondary'}
          disabled={unpaidOrders.length === 0}
          onClick={pay}
        >
          <span>Pay all ({unpaidOrders.length} orders)</span>
        </Button>
      </div>
    </div>
  )
}
