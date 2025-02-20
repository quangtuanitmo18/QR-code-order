import { formatCurrency } from '@/lib/utils'
import { DishResType } from '@/schemaValidations/dish.schema'
import Image from 'next/image'

export default async function DishDetail({
  dish
}: {
  dish: DishResType['data'] | undefined
}) {
  if (!dish)
    return (
      <div>
        <h1 className='text-2xl lg:text-3xl font-semibold'>
          Món ăn không tồn tại
        </h1>
      </div>
    )
  return (
    <div className='space-y-4'>
      <h1 className='text-2xl lg:text-3xl font-semibold'>{dish.name}</h1>
      <div className='font-semibold'>Giá: {formatCurrency(dish.price)}</div>
      <Image
        src={dish.image}
        width={700}
        height={700}
        quality={100}
        alt={dish.name}
        className='object-cover w-full h-full max-w-[1080px] max-h-[1080px] rounded-md'
        title={dish.name}
      />
      <p>{dish.description}</p>
    </div>
  )
}
