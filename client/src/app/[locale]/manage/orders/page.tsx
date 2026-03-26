import OrderTable from '@/app/[locale]/manage/orders/order-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Orders',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/orders`

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
    },
  }
}

export default async function OrdersPage(props: Props) {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Orders',
  })

  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2 sm:space-y-4">
        <Card x-chunk="dashboard-06-chunk-0" className="overflow-hidden border-border/50 shadow-md">

          <CardHeader className="bg-muted/10">
            <CardTitle className="text-xl sm:text-2xl">{t('title')}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <OrderTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
