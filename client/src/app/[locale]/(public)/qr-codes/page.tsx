import tableApiRequest from '@/apiRequests/table'
import envConfig, { Locale } from '@/config'
import { baseOpenGraph } from '@/shared-metadata'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import QRCodesList from './qr-codes-list'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'QRCodes',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/qr-codes`

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
  }
}

export default async function QRCodesPage(props: Props) {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'QRCodes',
  })

  // Fetch tables at build time (SSG) with revalidation tag
  let tables: any[] = []

  try {
    const result = await tableApiRequest.sGetList()
    tables = result.data.filter((table: any) => table.status !== 'Hidden')
  } catch (error) {
    console.error('Failed to fetch tables:', error)
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>

      <QRCodesList tables={tables} />
    </div>
  )
}
