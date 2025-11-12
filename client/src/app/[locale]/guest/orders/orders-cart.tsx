'use client'

import guestApiRequest from '@/apiRequests/guest'
import { useAppStore } from '@/components/app-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/components/ui/use-toast'
import { OrderStatus, PaymentMethod } from '@/constants/type'
import { useRouter } from '@/i18n/routing'
import { convertUSDtoRUB, convertUSDtoVND, formatRUB, formatUSD, formatVND } from '@/lib/currency'
import { formatCurrency, getOrderStatus } from '@/lib/utils'
import { useGuestGetOrderListQuery } from '@/queries/useGuest'
import { PayGuestOrdersResType, UpdateOrderResType } from '@/schemaValidations/order.schema'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

export default function OrdersCart() {
  const { data, refetch } = useGuestGetOrderListQuery()
  const orders = useMemo(() => data?.payload.data ?? [], [data])
  const socket = useAppStore((state) => state.socket)
  const router = useRouter()
  const [amountVND, setAmountVND] = useState<number | null>(null)
  const [amountRUB, setAmountRUB] = useState<number | null>(null)
  const [formattedAmountUSD, setFormattedAmountUSD] = useState<string | null>(null)
  const [formattedAmountVND, setFormattedAmountVND] = useState<string | null>(null)
  const [formattedAmountRUB, setFormattedAmountRUB] = useState<string | null>(null)
  // Payment state
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(PaymentMethod.Cash)

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

  const handlePayment = async () => {
    try {
      setIsPaymentLoading(true)

      const result = await guestApiRequest.createPayment({
        paymentMethod: selectedPaymentMethod as any,
        currency: 'USD',
      })

      if (result.payload.data.paymentUrl) {
        window.location.href = result.payload.data.paymentUrl
      } else {
        // cash payment dont need payment url
        toast({
          title: 'Payment Successful',
          description: `Paid ${formattedAmountUSD} (${formattedAmountVND})`,
          variant: 'default',
        })
        refetch()
        setIsPaymentLoading(false)
        router.push('/guest/orders')
      }
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      })
      setIsPaymentLoading(false)
    }
  }

  useEffect(() => {
    const fetchAmount = async () => {
      try {
        const amountVND = await convertUSDtoVND(waitingForPaying.price)
        const amountRUB = await convertUSDtoRUB(waitingForPaying.price)
        setAmountVND(amountVND)
        setAmountRUB(amountRUB)
        const formattedAmountUSD = formatUSD(waitingForPaying.price)
        setFormattedAmountUSD(formattedAmountUSD)
        const formattedAmountVND = formatVND(amountVND)
        setFormattedAmountVND(formattedAmountVND)
        const formattedAmountRUB = formatRUB(amountRUB)
        setFormattedAmountRUB(formattedAmountRUB)
      } catch (error) {
        console.error('Failed to fetch amount:', error)
      }
    }
    fetchAmount()
  }, [waitingForPaying.price])

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
      {/* Order List */}
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
        {waitingForPaying.quantity > 0 && (
          <div className="rounded-lg border border-orange-500 bg-orange-50 p-4 dark:bg-orange-950">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-base font-semibold text-orange-700 dark:text-orange-300 sm:text-lg">
                Waiting for paying · {waitingForPaying.quantity} dishes
              </span>
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold text-orange-700 dark:text-orange-300 sm:text-xl">
                  {formattedAmountUSD}
                </span>
                <div className="flex flex-col items-end gap-0.5 text-sm text-orange-600 dark:text-orange-400">
                  <span>≈ {formattedAmountVND}</span>
                  <span>≈ {formattedAmountRUB}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mt-4 space-y-3">
              <Label className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Select Payment Method:
              </Label>
              <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PaymentMethod.Cash} id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer">
                    💵 Cash Payment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PaymentMethod.VNPay} id="vnpay" />
                  <Label htmlFor="vnpay" className="cursor-pointer">
                    💳 VNPay (Auto convert to VND) 🇻🇳
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PaymentMethod.Stripe} id="stripe" />
                  <Label htmlFor="stripe" className="cursor-pointer">
                    💳 Stripe (Credit/Debit Card - USD) 🌍
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PaymentMethod.YooKassa} id="yookassa" />
                  <Label htmlFor="yookassa" className="cursor-pointer">
                    💳 YooKassa (Auto convert to RUB) 🇷🇺
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={isPaymentLoading}
              className="mt-4 w-full"
              size="lg"
            >
              {isPaymentLoading
                ? 'Processing...'
                : selectedPaymentMethod === PaymentMethod.Cash ||
                    selectedPaymentMethod === PaymentMethod.Stripe
                  ? `Pay ${formattedAmountUSD}`
                  : selectedPaymentMethod === PaymentMethod.VNPay
                    ? `Pay ${formattedAmountVND}`
                    : selectedPaymentMethod === PaymentMethod.YooKassa
                      ? `Pay ${formattedAmountRUB}`
                      : `Pay ${formattedAmountUSD}`}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
