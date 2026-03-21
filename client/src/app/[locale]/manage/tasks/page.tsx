import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'
import TasksClient from './tasks-client'
import { useTranslations } from 'next-intl'

export default function TasksPage() {
  const t = useTranslations('Tasks')

  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2 sm:space-y-4">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">{t('title')}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <TasksClient />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
