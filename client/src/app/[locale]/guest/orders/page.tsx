import OrdersCart from '@/app/[locale]/guest/orders/orders-cart'
import { Receipt } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-[400px] space-y-6 sm:max-w-2xl md:max-w-4xl">
      <div className="flex flex-col items-center justify-center space-y-2 pb-4 pt-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Receipt className="h-6 w-6" />
        </div>
        <h1 className="text-center text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
          Your Order
        </h1>
        <div className="h-1 w-16 rounded-full bg-primary/20"></div>
      </div>
      <OrdersCart />
    </div>
  )
}
