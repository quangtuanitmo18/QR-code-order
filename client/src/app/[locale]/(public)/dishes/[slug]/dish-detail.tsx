import { formatCurrency } from '@/lib/utils'
import { DishResType } from '@/schemaValidations/dish.schema'
import Image from 'next/image'

export default async function DishDetail({ dish }: { dish: DishResType['data'] | undefined }) {
  if (!dish)
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Dish not found</h1>
      </div>
    )
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Mobile: Vertical layout, Desktop: Side by side */}
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8">
        {/* Image section */}
        <div className="w-full lg:w-1/2">
          <Image
            src={dish.image}
            width={700}
            height={700}
            quality={75}
            alt={dish.name}
            className="h-auto w-full rounded-lg object-cover shadow-lg sm:max-h-[400px] md:max-h-[500px] lg:max-h-[600px]"
            unoptimized
            title={dish.name}
            priority
          />
        </div>

        {/* Info section */}
        <div className="flex w-full flex-col space-y-3 sm:space-y-4 lg:w-1/2">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{dish.name}</h1>
          <div className="text-xl font-bold text-primary sm:text-2xl lg:text-3xl">
            {formatCurrency(dish.price)}
          </div>
          <div className="prose prose-sm sm:prose-base max-w-none">
            <p className="text-muted-foreground">{dish.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
