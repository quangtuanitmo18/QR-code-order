import OrdersCart from '@/app/[locale]/guest/orders/orders-cart'

export default function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-[400px] space-y-4 sm:max-w-2xl md:max-w-4xl">
      <h1 className="text-center text-xl font-bold sm:text-2xl md:text-3xl">🍕 Order</h1>
      <OrdersCart />
    </div>
  )
}
