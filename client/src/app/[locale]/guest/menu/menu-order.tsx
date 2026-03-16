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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
        {dishes
          .filter((dish) => dish.status !== DishStatus.Hidden)
          .map((dish) => {
            const currentQuantity = orders.find((order) => order.dishId === dish.id)?.quantity ?? 0
            const isSelected = currentQuantity > 0

            return (
              <div
                key={dish.id}
                className={cn(
                  'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-lg',
                  {
                    'pointer-events-none opacity-60 grayscale':
                      dish.status === DishStatus.Unavailable,
                    'border-primary/50 bg-primary/5 ring-1 ring-primary/20': isSelected,
                  }
                )}
              >
                <div className="flex gap-4 sm:flex-col">
                  {/* Image section */}
                  <div className="relative h-[100px] w-[100px] flex-shrink-0 overflow-hidden rounded-xl sm:h-[200px] sm:w-full md:h-[240px]">
                    {dish.status === DishStatus.Unavailable && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <span className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-foreground shadow-lg">
                          Unavailable
                        </span>
                      </div>
                    )}
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      fill
                      sizes="(max-width: 640px) 100px, (max-width: 768px) 100vw, 33vw"
                      quality={75}
                      unoptimized
                      className={cn('object-cover transition-transform duration-500', {
                        'group-hover:scale-110': dish.status !== DishStatus.Unavailable,
                      })}
                    />
                  </div>

                  {/* Info section */}
                  <div className="flex flex-1 flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">
                          {dish.name}
                        </h3>
                      </div>
                      {dish.category && dish.category !== 'Uncategorized' && (
                        <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-accent">
                          {dish.category}
                        </span>
                      )}
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                        {dish.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-lg font-black tracking-tight text-primary sm:text-xl">
                        {formatCurrency(dish.price)}
                      </p>
                      <div className="hidden sm:block">
                        <Quantity
                          onChange={(value) => handleQuantityChange(dish.id, value)}
                          value={currentQuantity}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile quantity controls (bottom aligned) */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3 sm:hidden">
                  <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                  <Quantity
                    onChange={(value) => handleQuantityChange(dish.id, value)}
                    value={currentQuantity}
                  />
                </div>
              </div>
            )
          })}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-50 -mx-4 mt-8 translate-y-4 border-t border-border/50 bg-background/80 p-4 pb-8 backdrop-blur-xl sm:mx-0 sm:translate-y-0 sm:rounded-t-3xl sm:px-6">
        <Button
          className={cn(
            'w-full justify-between rounded-full py-6 text-lg font-bold shadow-xl transition-all duration-300',
            orders.length > 0
              ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 hover:shadow-primary/25'
              : 'opacity-50 grayscale'
          )}
          size="lg"
          onClick={handleOrder}
          disabled={orders.length === 0}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm">
              {orders.length}
            </span>
            <span>Place Order</span>
          </div>
          <span className="text-xl tracking-tight">{formatCurrency(totalPrice)}</span>
        </Button>
      </div>
    </>
  )
}
