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
    <div className="w-full space-y-4">
      <section className="relative z-10">
        <span className="absolute left-0 top-0 z-10 h-full w-full bg-black opacity-50"></span>
        <Image
          src="/banner.png"
          width={400}
          height={200}
          quality={80}
          loading="lazy"
          alt="Banner"
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
        <div className="relative z-20 px-4 py-10 sm:px-10 md:px-20 md:py-20">
          <h1 className="text-center text-xl font-bold sm:text-2xl md:text-4xl lg:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-center text-sm sm:text-base">{t('slogan')}</p>
        </div>
      </section>
      <section className="space-y-10 py-16">
        <h2 className="text-center text-2xl font-bold">{t('h2')}</h2>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          {dishList.map((dish) => (
            <Link
              href={`/dishes/${generateSlugUrl({
                name: dish.name,
                id: dish.id,
              })}`}
              className="w flex gap-4"
              key={dish.id}
            >
              <div className="flex-shrink-0">
                <Image
                  src={dish.image}
                  width={150}
                  height={150}
                  quality={80}
                  alt={dish.name}
                  className="h-[150px] w-[150px] rounded-md object-cover"
                  unoptimized
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{dish.name}</h3>
                <p className="">{dish.description}</p>
                <p className="font-semibold">{formatCurrency(dish.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
