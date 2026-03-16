import MenuOrder from '@/app/[locale]/guest/menu/menu-order'
import envConfig, { Locale } from '@/config'
import { baseOpenGraph } from '@/shared-metadata'
import { Utensils } from 'lucide-react'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'GuestMenu',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/guest/menu`

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      ...baseOpenGraph,
      title: t('title'),
      description: t('description'),
      url,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
    },
  }
}

export default async function MenuPage() {
  return (
    <div className="mx-auto w-full max-w-[400px] space-y-6 sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
      <div className="flex flex-col items-center justify-center space-y-2 pb-4 pt-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Utensils className="h-6 w-6" />
        </div>
        <h1 className="text-center text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
          Our Menu
        </h1>
        <div className="h-1 w-16 rounded-full bg-primary/20"></div>
      </div>
      <MenuOrder />
    </div>
  )
}
