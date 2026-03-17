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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {dishes
          .filter((dish) => dish.status !== DishStatus.Hidden)
          .map((dish) => (
            <div
              key={dish.id}
              className={cn(
                'group overflow-hidden rounded-2xl border border-border/40 bg-card shadow-premium transition-all hover:shadow-premium-lg sm:flex-col',
                {
                  'pointer-events-none opacity-50': dish.status === DishStatus.Unavailable,
                }
              )}
            >
              {/* Image */}
              <div className="relative aspect-[3/2] flex-shrink-0 overflow-hidden sm:w-full">
                {dish.status === DishStatus.Unavailable && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/60 text-sm font-semibold text-white backdrop-blur-sm">
                    Unavailable
                  </span>
                )}
                <Image
                  src={dish.image}
                  alt={dish.name}
                  height={200}
                  width={300}
                  quality={75}
                  unoptimized
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Price badge */}
                <div className="absolute bottom-2 right-2 rounded-full bg-background/90 px-3 py-1 text-sm font-bold text-primary shadow-md backdrop-blur-sm">
                  {formatCurrency(dish.price)}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col space-y-2 p-4 sm:p-5">
                <h3 className="text-sm font-semibold sm:text-base">{dish.name}</h3>
                {dish.category && dish.category !== 'Uncategorized' && (
                  <span className="inline-block w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {dish.category}
                  </span>
                )}
                <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                  {dish.description}
                </p>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-center border-t border-border/30 px-4 py-3 sm:justify-start">
                <Quantity
                  onChange={(value) => handleQuantityChange(dish.id, value)}
                  value={orders.find((order) => order.dishId === dish.id)?.quantity ?? 0}
                />
              </div>
            </div>
          ))}
      </div>

      {/* ── Sticky Order Bar ── */}
      <div className="sticky bottom-0 pb-4 pt-4">
        <Button
          className="w-full justify-between rounded-2xl bg-primary px-6 py-6 text-base font-semibold text-primary-foreground shadow-glow-lg transition-all hover:bg-primary/90"
          size="lg"
          onClick={handleOrder}
          disabled={orders.length === 0}
        >
          <span>Order · {orders.length} dishes</span>
          <span className="rounded-full bg-white/20 px-4 py-1">{formatCurrency(totalPrice)}</span>
        </Button>
      </div>
    </>
  )
}
