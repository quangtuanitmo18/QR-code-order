import { formatCurrency } from '@/lib/utils'
import { DishResType } from '@/schemaValidations/dish.schema'
import Image from 'next/image'

export default async function DishDetail({ dish }: { dish: DishResType['data'] | undefined }) {
  if (!dish)
    return (
      <div>
        <h1 className="text-2xl font-semibold lg:text-3xl">Dish not found</h1>
      </div>
    )
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold lg:text-3xl">{dish.name}</h1>
      <div className="font-semibold">Price: {formatCurrency(dish.price)}</div>
      <Image
        src={dish.image}
        width={700}
        height={700}
        quality={70}
        alt={dish.name}
        className="h-full max-h-[1080px] w-full max-w-[1080px] rounded-md object-cover"
        unoptimized
        title={dish.name}
      />
      <p>{dish.description}</p>
    </div>
  )
}
