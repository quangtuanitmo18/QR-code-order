'use client'

import guestApiRequest from '@/apiRequests/guest'
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
import { cn, formatCurrency, getOrderStatus } from '@/lib/utils'
import { useValidateCouponMutation } from '@/queries/useCoupon'
import { useGuestGetOrderListQuery } from '@/queries/useGuest'
import { PayGuestOrdersResType, UpdateOrderResType } from '@/schemaValidations/order.schema'
import { useAppStore } from '@/store/useAppStore'
import { CheckCircle2, CircleDollarSign, CreditCard, Receipt, Tag, Wallet } from 'lucide-react'
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
      <div className="space-y-4 sm:space-y-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No orders yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your delicious meals will appear here
            </p>
          </div>
        ) : (
          orders.map((order, index) => (
            <div
              key={order.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md sm:gap-5 sm:p-5"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground sm:text-base">
                  Order #{order.id}
                </span>
                <Badge
                  variant={order.status === OrderStatus.Paid ? 'default' : 'outline'}
                  className={cn('px-3 py-1 font-semibold', {
                    'bg-green-500 hover:bg-green-600': order.status === OrderStatus.Paid,
                    'border-primary text-primary': order.status === OrderStatus.Delivered,
                    'border-orange-500 text-orange-600': order.status === OrderStatus.Processing,
                  })}
                >
                  {getOrderStatus(order.status)}
                </Badge>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-transparent p-2 transition-colors hover:border-border/50 hover:bg-muted/30"
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={item.dishSnapshot.image}
                        alt={item.dishSnapshot.name}
                        height={120}
                        width={120}
                        quality={75}
                        unoptimized
                        className="h-16 w-16 rounded-xl object-cover shadow-sm sm:h-20 sm:w-20"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center space-y-2">
                      <h3 className="text-base font-bold sm:text-lg">{item.dishSnapshot.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span className="text-muted-foreground">
                          {formatCurrency(item.unitPrice)}
                        </span>
                        <span className="text-muted-foreground/50">×</span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-secondary-foreground">
                          {item.quantity}
                        </span>
                        <span className="ml-auto text-base font-black text-primary">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary section */}
      <div className="pb-4 pt-8">
        {waitingForPaying.quantity > 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-xl dark:bg-card/90">
            {/* Top accent line */}
            <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary"></div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">Payment Summary</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                    Waiting for paying: {waitingForPaying.quantity} dishes
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  {discountAmount > 0 && (
                    <div className="mb-2 flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Tag className="h-3.5 w-3.5" />-{formatCurrency(discountAmount)}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">Total:</span>
                    <span className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                      {formatCurrency(waitingForPaying.price - discountAmount)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col items-end gap-1 font-medium text-muted-foreground">
                    <span className="text-sm">≈ {formattedAmountVND}</span>
                    <span className="text-sm">≈ {formattedAmountRUB}</span>
                  </div>
                </div>
              </div>

              {/* Coupon Input */}
              <div className="mt-6 space-y-3">
                <Label className="flex items-center gap-2 text-base font-bold text-card-foreground">
                  <Tag className="h-4 w-4 text-primary" /> Coupon Code
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter code here"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase())
                        setCouponError(null)
                      }}
                      onBlur={handleValidateCoupon}
                      className="h-12 rounded-xl bg-background/50 px-4 uppercase transition-all focus:bg-background"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 rounded-xl px-6 font-bold"
                    onClick={handleValidateCoupon}
                    disabled={validateCouponMutation.isPending}
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive"></span>
                    {couponError}
                  </p>
                )}
                {discountAmount > 0 && (
                  <p className="flex items-center gap-1.5 text-sm font-bold text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Coupon applied successfully!
                  </p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold text-card-foreground">
                    Select Payment Method
                  </Label>
                  <PaymentTestInfoDialog paymentMethod={selectedPaymentMethod} />
                </div>

                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {[
                    {
                      id: PaymentMethod.Cash,
                      icon: Wallet,
                      label: 'Cash Payment',
                      desc: 'Pay at counter',
                    },
                    {
                      id: PaymentMethod.VNPay,
                      icon: CircleDollarSign,
                      label: 'VNPay',
                      desc: 'Auto convert VND 🇻🇳',
                    },
                    {
                      id: PaymentMethod.Stripe,
                      icon: CreditCard,
                      label: 'Stripe',
                      desc: 'Credit/Debit USD 🌍',
                    },
                    {
                      id: PaymentMethod.YooKassa,
                      icon: CreditCard,
                      label: 'YooKassa',
                      desc: 'Auto convert RUB 🇷🇺',
                    },
                  ].map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        'relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-primary/5',
                        selectedPaymentMethod === method.id
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/50 bg-background/50'
                      )}
                    >
                      <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                      <Label
                        htmlFor={method.id}
                        className="flex cursor-pointer items-center justify-between font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <method.icon
                            className={cn(
                              'h-5 w-5',
                              selectedPaymentMethod === method.id
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                          {method.label}
                        </div>
                        <div
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full border-2',
                            selectedPaymentMethod === method.id
                              ? 'border-primary'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {selectedPaymentMethod === method.id && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                      </Label>
                      <p className="pl-7 text-xs font-medium text-muted-foreground">
                        {method.desc}
                      </p>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isPaymentLoading}
                className="mt-8 h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-lg font-bold shadow-xl transition-all hover:opacity-90 hover:shadow-primary/25 disabled:opacity-50"
                size="lg"
              >
                {isPaymentLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></span>
                    Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Secure checkout ({formatCurrency(waitingForPaying.price - discountAmount)})
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
