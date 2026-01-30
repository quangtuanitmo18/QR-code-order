'use client'
import Quantity from '@/app/[locale]/guest/menu/quantity'
import GuestsDialog from '@/app/[locale]/manage/orders/guests-dialog'
import { TablesDialog } from '@/app/[locale]/manage/orders/tables-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { DishStatus } from '@/constants/type'
import { cn, formatCurrency, handleErrorApi } from '@/lib/utils'
import { useCreateGuestMutation } from '@/queries/useAccount'
import { useDishListQuery } from '@/queries/useDish'
import { useCreateOrderMutation } from '@/queries/useOrder'
import { useValidateCouponMutation } from '@/queries/useCoupon'
import { GetListGuestsResType } from '@/schemaValidations/account.schema'
import { GuestLoginBody, GuestLoginBodyType } from '@/schemaValidations/guest.schema'
import { CreateOrdersBodyType } from '@/schemaValidations/order.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

export default function AddOrder() {
  const [open, setOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<GetListGuestsResType['data'][0] | null>(null)
  const [isNewGuest, setIsNewGuest] = useState(true)
  const [orders, setOrders] = useState<CreateOrdersBodyType['orders']>([])
  const { data } = useDishListQuery()
  const dishes = useMemo(() => data?.payload.data ?? [], [data])

  const totalPrice = useMemo(() => {
    return dishes.reduce((result, dish) => {
      const order = orders.find((order) => order.dishId === dish.id)
      if (!order) return result
      return result + order.quantity * dish.price
    }, 0)
  }, [dishes, orders])
  const createOrderMutation = useCreateOrderMutation()
  const createGuestMutation = useCreateGuestMutation()
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponId, setCouponId] = useState<number | undefined>()
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const validateCouponMutation = useValidateCouponMutation()

  const form = useForm<GuestLoginBodyType>({
    resolver: zodResolver(GuestLoginBody),
    defaultValues: {
      name: '',
      tableNumber: 0,
    },
  })
  const name = form.watch('name')
  const tableNumber = form.watch('tableNumber')

  const handleQuantityChange = (dishId: number, quantity: number) => {
    setOrders((prevOrders) => {
      if (quantity === 0) {
        return prevOrders.filter((order) => order.dishId !== dishId)
      }
      const index = prevOrders.findIndex((order) => order.dishId === dishId)
      if (index === -1) {
        return [...prevOrders, { dishId, quantity }]
      }
      const newOrders = [...prevOrders]
      newOrders[index] = { ...newOrders[index], quantity }
      return newOrders
    })
  }

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(null)
      setCouponId(undefined)
      setDiscountAmount(0)
      return
    }

    if (totalPrice === 0) {
      setCouponError('No items to apply coupon')
      return
    }

    try {
      const dishIds = orders.map((order) => order.dishId)
      const guestId = selectedGuest?.id ?? (isNewGuest ? undefined : undefined)

      const result = await validateCouponMutation.mutateAsync({
        code: couponCode.toUpperCase(),
        orderTotal: totalPrice,
        dishIds: dishIds.length > 0 ? dishIds : undefined,
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

  const handleOrder = async () => {
    try {
      let guestId = selectedGuest?.id
      if (isNewGuest) {
        const guestRes = await createGuestMutation.mutateAsync({
          name,
          tableNumber,
        })
        guestId = guestRes.payload.data.id
      }
      if (!guestId) {
        toast({
          description: 'Please select a customer',
        })
        return
      }
      await createOrderMutation.mutateAsync({
        guestId,
        orders,
        couponId,
      })
      reset()
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      })
    }
  }

  const reset = () => {
    form.reset()
    setSelectedGuest(null)
    setIsNewGuest(true)
    setOrders([])
    setCouponCode('')
    setCouponId(undefined)
    setDiscountAmount(0)
    setCouponError(null)
    setOpen(false)
  }

  return (
    <Dialog
      onOpenChange={(value) => {
        if (!value) {
          reset()
        }
        setOpen(value)
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add order</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen overflow-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add order</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 items-center justify-items-start gap-4">
          <Label htmlFor="isNewGuest">New customer</Label>
          <div className="col-span-3 flex items-center">
            <Switch id="isNewGuest" checked={isNewGuest} onCheckedChange={setIsNewGuest} />
          </div>
        </div>
        {isNewGuest && (
          <Form {...form}>
            <form
              noValidate
              className="grid auto-rows-max items-start gap-4 md:gap-8"
              id="add-employee-form"
            >
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                        <Label htmlFor="name">Customer name</Label>
                        <div className="col-span-3 w-full space-y-2">
                          <Input id="name" className="w-full" {...field} />
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tableNumber"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                        <Label htmlFor="tableNumber">Select table</Label>
                        <div className="col-span-3 w-full space-y-2">
                          <div className="flex items-center gap-4">
                            <div>{field.value}</div>
                            <TablesDialog
                              onChoose={(table) => {
                                field.onChange(table.number)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        )}
        {!isNewGuest && (
          <GuestsDialog
            onChoose={(guest) => {
              setSelectedGuest(guest)
            }}
          />
        )}
        {!isNewGuest && selectedGuest && (
          <div className="grid grid-cols-4 items-center justify-items-start gap-4">
            <Label htmlFor="selectedGuest">Customer selected</Label>
            <div className="col-span-3 flex w-full items-center gap-4">
              <div>
                {selectedGuest.name} (#{selectedGuest.id})
              </div>
              <div>Table: {selectedGuest.tableNumber}</div>
            </div>
          </div>
        )}
        {dishes
          .filter((dish) => dish.status !== DishStatus.Hidden)
          .map((dish) => (
            <div
              key={dish.id}
              className={cn('flex gap-4', {
                'pointer-events-none': dish.status === DishStatus.Unavailable,
              })}
            >
              <div className="relative flex-shrink-0">
                {dish.status === DishStatus.Unavailable && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm">
                    Unavailable
                  </span>
                )}
                <Image
                  src={dish.image}
                  alt={dish.name}
                  height={100}
                  width={100}
                  quality={100}
                  unoptimized
                  className="h-[80px] w-[80px] rounded-md object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm">{dish.name}</h3>
                <p className="text-xs">{dish.description}</p>
                <p className="text-xs font-semibold">{formatCurrency(dish.price)}</p>
              </div>
              <div className="ml-auto flex flex-shrink-0 items-center justify-center">
                <Quantity
                  onChange={(value) => handleQuantityChange(dish.id, value)}
                  value={orders.find((order) => order.dishId === dish.id)?.quantity ?? 0}
                />
              </div>
            </div>
          ))}
        {/* Coupon Input */}
        {orders.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Coupon Code (optional):</Label>
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
        )}

        <DialogFooter>
          <Button
            className="w-full justify-between"
            onClick={handleOrder}
            disabled={orders.length === 0}
          >
            <span>Order · {orders.length} dishes</span>
            <span>
              {formatCurrency(totalPrice - discountAmount)}
              {discountAmount > 0 && (
                <span className="ml-2 text-xs text-green-600 line-through">
                  {formatCurrency(totalPrice)}
                </span>
              )}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
