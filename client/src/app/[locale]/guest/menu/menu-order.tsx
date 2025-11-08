'use client'
import Quantity from '@/app/[locale]/guest/menu/quantity'
import { Button } from '@/components/ui/button'
import { DishStatus } from '@/constants/type'
import { useRouter } from '@/i18n/routing'
import { cn, formatCurrency, handleErrorApi } from '@/lib/utils'
import { useDishListQuery } from '@/queries/useDish'
import { useGuestOrderMutation } from '@/queries/useGuest'
import { GuestCreateOrdersBodyType } from '@/schemaValidations/guest.schema'
import Image from 'next/image'
import { useMemo, useState } from 'react'

export default function MenuOrder() {
  const { data } = useDishListQuery()
  const dishes = useMemo(() => data?.payload.data ?? [], [data])
  const [orders, setOrders] = useState<GuestCreateOrdersBodyType>([])
  const { mutateAsync } = useGuestOrderMutation()
  const router = useRouter()
  // React 19 hoặc Next.js 15 thì không cần dùng useMemo chỗ này
  const totalPrice = useMemo(() => {
    return dishes.reduce((result, dish) => {
      const order = orders.find((order) => order.dishId === dish.id)
      if (!order) return result
      return result + order.quantity * dish.price
    }, 0)
  }, [dishes, orders])

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

  const handleOrder = async () => {
    try {
      await mutateAsync(orders)
      router.push(`/guest/orders`)
    } catch (error) {
      handleErrorApi({
        error,
      })
    }
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes
          .filter((dish) => dish.status !== DishStatus.Hidden)
          .map((dish) => (
            <div
              key={dish.id}
              className={cn(
                'flex gap-3 rounded-lg border bg-card p-3 shadow-sm sm:flex-col sm:gap-4 sm:p-4',
                {
                  'pointer-events-none opacity-60': dish.status === DishStatus.Unavailable,
                }
              )}
            >
              <div className="relative flex-shrink-0 sm:w-full">
                {dish.status === DishStatus.Unavailable && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 text-sm font-semibold text-white">
                    Unavailable
                  </span>
                )}
                <Image
                  src={dish.image}
                  alt={dish.name}
                  height={200}
                  width={200}
                  quality={75}
                  unoptimized
                  className="h-[80px] w-[80px] rounded-md object-cover sm:h-[180px] sm:w-full md:h-[200px]"
                />
              </div>
              <div className="flex flex-1 flex-col space-y-1 sm:space-y-2">
                <h3 className="text-sm font-semibold sm:text-base">{dish.name}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                  {dish.description}
                </p>
                <p className="text-sm font-bold text-primary sm:text-base">
                  {formatCurrency(dish.price)}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center justify-center sm:mt-auto sm:justify-start">
                <Quantity
                  onChange={(value) => handleQuantityChange(dish.id, value)}
                  value={orders.find((order) => order.dishId === dish.id)?.quantity ?? 0}
                />
              </div>
            </div>
          ))}
      </div>
      <div className="sticky bottom-0 bg-background pb-4 pt-4">
        <Button
          className="w-full justify-between shadow-lg"
          size="lg"
          onClick={handleOrder}
          disabled={orders.length === 0}
        >
          <span>Order · {orders.length} dishes</span>
          <span>{formatCurrency(totalPrice)}</span>
        </Button>
      </div>
    </>
  )
}
