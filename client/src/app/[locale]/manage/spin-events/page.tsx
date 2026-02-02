import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import SpinEventsClient from './spin-events-client'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'SpinEvents',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/spin-events`

  return {
    title: t('title') || 'Spin Events',
    description: t('description') || 'Manage spin events',
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
    },
  }
}

export default function SpinEventsPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2 sm:space-y-4">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Spin Events</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Manage spin events and their rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <SpinEventsClient />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
