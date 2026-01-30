import CalendarClient from '@/app/[locale]/manage/calendar/calendar-client'
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
    namespace: 'Calendar',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/calendar`

  return {
    title: t('title') || 'Calendar',
    description: t('description') || 'Work Schedule Calendar',
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
    },
  }
}

export default function CalendarPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="w-full space-y-2 sm:space-y-4">
        <Card x-chunk="dashboard-calendar-chunk-0">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Calendar</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Manage work schedules and company events
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense>
              <CalendarClient />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
