import AccountTable from '@/app/[locale]/manage/accounts/account-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import { Suspense } from 'react'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'ManageAccounts',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/accounts`

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

export default async function AccountsPage() {
  const cookieStore = await cookies()
  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2 sm:space-y-4">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Account</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Employee Account Management
            </CardDescription>
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
