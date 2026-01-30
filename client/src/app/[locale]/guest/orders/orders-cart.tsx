'use client'

import couponApiRequest from '@/apiRequests/coupon'
import guestApiRequest from '@/apiRequests/guest'
import { useAppStore } from '@/components/app-provider'
import { PaymentTestInfoDialog } from '@/components/payment-test-info-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/components/ui/use-toast'
import { OrderStatus, PaymentMethod } from '@/constants/type'
import { useRouter } from '@/i18n/routing'
import { convertUSDtoRUB, convertUSDtoVND, formatRUB, formatUSD, formatVND } from '@/lib/currency'
import { formatCurrency, getOrderStatus } from '@/lib/utils'
import { useGuestGetOrderListQuery } from '@/queries/useGuest'
import { useValidateCouponMutation } from '@/queries/useCoupon'
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
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponId, setCouponId] = useState<number | undefined>()
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const validateCouponMutation = useValidateCouponMutation()

  const { waitingForPaying, paid } = useMemo(() => {
    return orders.reduce(
      (result, order) => {
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)

        if (
          order.status === OrderStatus.Delivered ||
          order.status === OrderStatus.Processing ||
          order.status === OrderStatus.Pending
        ) {
          return {
            ...result,
            waitingForPaying: {
              price: result.waitingForPaying.price + order.totalAmount,
              quantity: result.waitingForPaying.quantity + totalQuantity,
            },
          }
        }
        if (order.status === OrderStatus.Paid) {
          return {
            ...result,
            paid: {
              price: result.paid.price + order.totalAmount,
              quantity: result.paid.quantity + totalQuantity,
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

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(null)
      setCouponId(undefined)
      setDiscountAmount(0)
      return
    }

    if (waitingForPaying.price === 0) {
      setCouponError('No orders to apply coupon')
      return
    }

    try {
      const dishIds = orders
        .filter((order) =>
          [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered].includes(
            order.status as any
          )
        )
        .flatMap((order) => order.items.map((item) => item.dishSnapshot.dishId).filter(Boolean))
      const uniqueDishIds = [...new Set(dishIds)] as number[]

      const guestId = orders[0]?.guestId ?? undefined

      const result = await validateCouponMutation.mutateAsync({
        code: couponCode.toUpperCase(),
        orderTotal: waitingForPaying.price,
        dishIds: uniqueDishIds.length > 0 ? uniqueDishIds : undefined,
        guestId,
      })

      if (result.payload.valid) {
        setCouponId(result.payload.coupon.id)
        setDiscountAmount(result.payload.discountAmount)
        setCouponError(null)
        toast({
          description: `Coupon applied! Discount: ${formatCurrency(result.payload.discountAmount)}`,
        })
      } else {
        setCouponError(result.payload.message)
        setCouponId(undefined)
        setDiscountAmount(0)
      }
    } catch (error: any) {
      setCouponError(error?.payload?.message || 'Failed to validate coupon')
      setCouponId(undefined)
      setDiscountAmount(0)
    }
  }

  const handlePayment = async () => {
    try {
      setIsPaymentLoading(true)

      const result = await guestApiRequest.createPayment({
        paymentMethod: selectedPaymentMethod as any,
        currency: 'USD',
        couponId,
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
        const finalAmount = waitingForPaying.price - discountAmount
        const amountVND = await convertUSDtoVND(finalAmount)
        const amountRUB = await convertUSDtoRUB(finalAmount)
        setAmountVND(amountVND)
        setAmountRUB(amountRUB)
        const formattedAmountUSD = formatUSD(finalAmount)
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
  }, [waitingForPaying.price, discountAmount])

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
      const firstItem = data.items[0]
      const name = firstItem?.dishSnapshot.name ?? 'Order'
      const quantity = data.items.reduce((sum, item) => sum + item.quantity, 0)
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
            className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm sm:gap-3 sm:p-4"
          >
            <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground sm:text-base">
              <span>Order #{order.id}</span>
              <Badge variant={'outline'} className="text-xs sm:text-sm">
                {getOrderStatus(order.status)}
              </Badge>
            </div>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 border-t pt-2 first:border-t-0 first:pt-0 sm:gap-4"
              >
                <div className="relative flex-shrink-0">
                  <Image
                    src={item.dishSnapshot.image}
                    alt={item.dishSnapshot.name}
                    height={120}
                    width={120}
                    quality={75}
                    unoptimized
                    className="h-[60px] w-[60px] rounded-md object-cover sm:h-[80px] sm:w-[80px]"
                  />
                </div>
                <div className="flex flex-1 flex-col space-y-1 sm:space-y-2">
                  <h3 className="text-sm font-semibold sm:text-base">{item.dishSnapshot.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
                    <span>{formatCurrency(item.unitPrice)}</span>
                    <span className="text-muted-foreground">×</span>
                    <Badge className="px-2 py-0.5">{item.quantity}</Badge>
                    <span className="ml-auto italic">{formatCurrency(item.totalPrice)}</span>
                  </div>
                </div>
              </div>
            ))}
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
                {discountAmount > 0 && (
                  <div className="mb-1 text-sm text-green-600 dark:text-green-400">
                    -{formatCurrency(discountAmount)} discount
                  </div>
                )}
                <span className="text-lg font-bold text-orange-700 dark:text-orange-300 sm:text-xl">
                  {formatCurrency(waitingForPaying.price - discountAmount)}
                </span>
                <div className="flex flex-col items-end gap-0.5 text-sm text-orange-600 dark:text-orange-400">
                  <span>≈ {formattedAmountVND}</span>
                  <span>≈ {formattedAmountRUB}</span>
                </div>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Coupon Code (optional):
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    setCouponError(null)
                  }}
                  onBlur={handleValidateCoupon}
                  className="flex-1 uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidateCoupon}
                  disabled={validateCouponMutation.isPending}
                >
                  Apply
                </Button>
              </div>
              {couponError && (
                <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>
              )}
              {discountAmount > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Coupon applied: {formatCurrency(discountAmount)} discount
                </p>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Select Payment Method:
                </Label>
                <PaymentTestInfoDialog paymentMethod={selectedPaymentMethod} />
              </div>
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
                : `Pay ${formatCurrency(waitingForPaying.price - discountAmount)}`}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
