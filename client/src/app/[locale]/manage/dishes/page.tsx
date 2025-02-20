import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import DishTable from '@/app/[locale]/manage/dishes/dish-table'
import { Suspense } from 'react'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Dishes'
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/dishes`

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: url
    },
    robots: {
      index: false
    }
  }
}

export default function DishesPage() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Món ăn</CardTitle>
            <CardDescription>Quản lý món ăn</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <DishTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
