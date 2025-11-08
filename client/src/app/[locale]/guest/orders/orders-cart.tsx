'use client'

import { useAppStore } from '@/components/app-provider'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { OrderStatus } from '@/constants/type'
import { formatCurrency, getOrderStatus } from '@/lib/utils'
import { useGuestGetOrderListQuery } from '@/queries/useGuest'
import { PayGuestOrdersResType, UpdateOrderResType } from '@/schemaValidations/order.schema'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'

export default function OrdersCart() {
  const { data, refetch } = useGuestGetOrderListQuery()
  const orders = useMemo(() => data?.payload.data ?? [], [data])
  const socket = useAppStore((state) => state.socket)
  const { waitingForPaying, paid } = useMemo(() => {
    return orders.reduce(
      (result, order) => {
        if (
          order.status === OrderStatus.Delivered ||
          order.status === OrderStatus.Processing ||
          order.status === OrderStatus.Pending
        ) {
          return {
            ...result,
            waitingForPaying: {
              price: result.waitingForPaying.price + order.dishSnapshot.price * order.quantity,
              quantity: result.waitingForPaying.quantity + order.quantity,
            },
          }
        }
        if (order.status === OrderStatus.Paid) {
          return {
            ...result,
            paid: {
              price: result.paid.price + order.dishSnapshot.price * order.quantity,
              quantity: result.paid.quantity + order.quantity,
            },
          }
        }
        return result
      },
      {
        waitingForPaying: {
          price: 0,
          quantity: 0,
        },
        paid: {
          price: 0,
          quantity: 0,
        },
      }
    )
  }, [orders])

  useEffect(() => {
    if (socket?.connected) {
      onConnect()
    }

    function onConnect() {
      console.log(socket?.id)
    }

    function onDisconnect() {
      console.log('disconnect')
    }

    function onUpdateOrder(data: UpdateOrderResType['data']) {
      const {
        dishSnapshot: { name },
        quantity,
      } = data
      toast({
        description: `Dish ${name} (Qty: ${quantity}) has just been updated to status "${getOrderStatus(
          data.status
        )}"`,
      })
      refetch()
    }

    function onPayment(data: PayGuestOrdersResType['data']) {
      const { guest } = data[0]
      toast({
        description: `${guest?.name} at table ${guest?.tableNumber} has successfully paid for ${data.length} orders`,
      })

      refetch()
    }

    socket?.on('update-order', onUpdateOrder)
    socket?.on('payment', onPayment)
    socket?.on('connect', onConnect)
    socket?.on('disconnect', onDisconnect)

    return () => {
      socket?.off('connect', onConnect)
      socket?.off('disconnect', onDisconnect)
      socket?.off('update-order', onUpdateOrder)
      socket?.off('payment', onPayment)
    }
  }, [refetch, socket])
  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className="flex gap-3 rounded-lg border bg-card p-3 shadow-sm sm:gap-4 sm:p-4"
          >
            <div className="flex min-w-[24px] items-start pt-1 text-sm font-semibold text-muted-foreground sm:text-base">
              {index + 1}
            </div>
            <div className="relative flex-shrink-0">
              <Image
                src={order.dishSnapshot.image}
                alt={order.dishSnapshot.name}
                height={120}
                width={120}
                quality={75}
                unoptimized
                className="h-[80px] w-[80px] rounded-md object-cover sm:h-[100px] sm:w-[100px]"
              />
            </div>
            <div className="flex flex-1 flex-col space-y-1 sm:space-y-2">
              <h3 className="text-sm font-semibold sm:text-base">{order.dishSnapshot.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
                <span>{formatCurrency(order.dishSnapshot.price)}</span>
                <span className="text-muted-foreground">×</span>
                <Badge className="px-2 py-0.5">{order.quantity}</Badge>
              </div>
              <div className="flex items-center pt-1">
                <Badge variant={'outline'} className="text-xs sm:text-sm">
                  {getOrderStatus(order.status)}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary section */}
      <div className="space-y-3 pt-4 sm:space-y-4">
        {paid.quantity !== 0 && (
          <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-base font-semibold text-green-700 dark:text-green-300 sm:text-lg">
                Order Paid · {paid.quantity} dishes
              </span>
              <span className="text-lg font-bold text-green-700 dark:text-green-300 sm:text-xl">
                {formatCurrency(paid.price)}
              </span>
            </div>
          </div>
        )}
        <div className="rounded-lg border border-orange-500 bg-orange-50 p-4 dark:bg-orange-950">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-base font-semibold text-orange-700 dark:text-orange-300 sm:text-lg">
              Waiting for paying · {waitingForPaying.quantity} dishes
            </span>
            <span className="text-lg font-bold text-orange-700 dark:text-orange-300 sm:text-xl">
              {formatCurrency(waitingForPaying.price)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
