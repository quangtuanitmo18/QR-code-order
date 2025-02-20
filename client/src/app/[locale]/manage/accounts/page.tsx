import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import AccountTable from '@/app/[locale]/manage/accounts/account-table'
import { Suspense } from 'react'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'ManageAccounts'
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/accounts`

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

export default async function AccountsPage() {
  const cookieStore = await cookies()
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Tài khoản</CardTitle>
            <CardDescription>Quản lý tài khoản nhân viên</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <AccountTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
