import OrdersCart from '@/app/[locale]/guest/orders/orders-cart'

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-[400px] space-y-4">
      <h1 className="text-center text-xl font-bold">🍕 Order</h1>
      <OrdersCart />
    </div>
  )
}
