import dishApiRequest from '@/apiRequests/dish'
import envConfig, { Locale } from '@/config'
import { Link } from '@/i18n/routing'
import { htmlToTextForDescription } from '@/lib/server-utils'
import { formatCurrency, generateSlugUrl } from '@/lib/utils'
import { DishListResType } from '@/schemaValidations/dish.schema'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params

  const { locale } = params

  const t = await getTranslations({ locale, namespace: 'HomePage' })
  const url = envConfig.NEXT_PUBLIC_URL + `/${locale}`

  return {
    title: t('title'),
    description: htmlToTextForDescription(t('description')),
    alternates: {
      canonical: url,
    },
  }
}

export default async function Home(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params

  const { locale } = params

  setRequestLocale(locale)
  const t = await getTranslations('HomePage')
  let dishList: DishListResType['data'] = []
  try {
    const result = await dishApiRequest.list()
    const {
      payload: { data },
    } = result
    dishList = data
  } catch (error) {
    return <div>Something went wrong</div>
  }
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Hero Banner */}
      <section className="relative z-10 min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
        <span className="absolute left-0 top-0 z-10 h-full w-full bg-black opacity-50"></span>
        <Image
          src="/banner.png"
          width={1920}
          height={600}
          quality={85}
          priority
          alt="Banner"
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
        <div className="relative z-20 flex h-full min-h-[200px] flex-col items-center justify-center px-4 py-10 sm:min-h-[250px] sm:px-10 sm:py-16 md:min-h-[300px] md:px-20 md:py-20">
          <h1 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-center text-sm text-white/90 sm:mt-4 sm:text-base md:text-lg">
            {t('slogan')}
          </p>
        </div>
      </section>

      {/* Dishes Section */}
      <section className="space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl md:text-4xl">{t('h2')}</h2>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {dishList.map((dish) => (
            <Link
              href={`/dishes/${generateSlugUrl({
                name: dish.name,
                id: dish.id,
              })}`}
              className="group flex gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-lg sm:flex-col sm:gap-4 sm:p-4"
              key={dish.id}
            >
              <div className="relative flex-shrink-0 overflow-hidden rounded-md sm:w-full">
                <Image
                  src={dish.image}
                  width={300}
                  height={300}
                  quality={80}
                  alt={dish.name}
                  className="h-[100px] w-[100px] object-cover transition-transform group-hover:scale-105 sm:h-[200px] sm:w-full md:h-[250px]"
                  unoptimized
                />
              </div>
              <div className="flex flex-1 flex-col space-y-1 sm:space-y-2">
                <h3 className="text-base font-semibold group-hover:text-primary sm:text-lg md:text-xl">
                  {dish.name}
                </h3>
                <p className="line-clamp-2 text-xs text-muted-foreground sm:line-clamp-3 sm:text-sm">
                  {dish.description}
                </p>
                <p className="mt-auto text-sm font-bold text-primary sm:text-base">
                  {formatCurrency(dish.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
