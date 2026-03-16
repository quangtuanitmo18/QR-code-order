import { Link } from '@/i18n/routing'
import { formatCurrency } from '@/lib/utils'
import { DishResType } from '@/schemaValidations/dish.schema'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default async function DishDetail({ dish }: { dish: DishResType['data'] | undefined }) {
  if (!dish)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-destructive sm:text-3xl lg:text-4xl">
          Dish not found
        </h1>
        <Link
          href="/guest/menu"
          className="text-muted-foreground underline transition-colors hover:text-primary"
        >
          Return to menu
        </Link>
      </div>
    )
  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8 sm:space-y-8 sm:py-12 md:space-y-10">
      <Link
        href="/guest/menu"
        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Menu
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12 xl:gap-16">
        {/* Image section */}
        <div className="w-full lg:w-1/2">
          <div className="group relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <Image
              src={dish.image}
              width={800}
              height={800}
              quality={85}
              sizes="(max-width: 1024px) 100vw, 50vw"
              alt={dish.name}
              className="aspect-square w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              unoptimized
              title={dish.name}
              priority
            />
          </div>
        </div>

        {/* Info section */}
        <div className="flex w-full flex-col space-y-6 lg:w-1/2">
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {dish.name}
            </h1>
            <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-2xl font-black text-primary sm:text-3xl lg:px-6 lg:py-2 lg:text-4xl">
              {formatCurrency(dish.price)}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm dark:bg-card/30 sm:p-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Description
            </h3>
            <div className="prose prose-sm max-w-none text-base leading-relaxed text-foreground sm:prose-base">
              <p>{dish.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
