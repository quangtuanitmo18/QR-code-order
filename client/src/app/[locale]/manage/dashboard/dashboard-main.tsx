'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useDashboardIndicator } from '@/queries/useIndicator'
import { endOfDay, format, startOfDay, subDays, startOfMonth } from 'date-fns'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const RevenueLineChart = dynamic(
  () =>
    import('@/app/[locale]/manage/dashboard/revenue-line-chart').then((m) => m.RevenueLineChart),
  { ssr: false }
)

const DishBarChart = dynamic(
  () => import('@/app/[locale]/manage/dashboard/dish-bar-chart').then((m) => m.DishBarChart),
  { ssr: false }
)

const initFromDate = startOfDay(new Date())
const initToDate = endOfDay(new Date())
export default function DashboardMain() {
  const t = useTranslations('DashboardMain')
  const [fromDate, setFromDate] = useState(initFromDate)
  const [toDate, setToDate] = useState(initToDate)
  const { data } = useDashboardIndicator({
    fromDate,
    toDate,
  })
  const revenue = data?.payload.data.revenue ?? 0
  const guestCount = data?.payload.data.guestCount ?? 0
  const orderCount = data?.payload.data.orderCount ?? 0
  const servingTableCount = data?.payload.data.servingTableCount ?? 0
  const revenueByDate = data?.payload.data.revenueByDate ?? []
  const dishIndicator = data?.payload.data.dishIndicator ?? []

  const resetDateFilter = () => {
    setFromDate(initFromDate)
    setToDate(initToDate)
  }

  const setToday = () => {
    setFromDate(startOfDay(new Date()))
    setToDate(endOfDay(new Date()))
  }

  const setLast7Days = () => {
    setFromDate(startOfDay(subDays(new Date(), 6)))
    setToDate(endOfDay(new Date()))
  }

  const setThisMonth = () => {
    setFromDate(startOfMonth(new Date()))
    setToDate(endOfDay(new Date()))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('fromLabel')}</span>
          <Input
            type="datetime-local"
            placeholder={t('fromPlaceholder')}
            className="flex-1 text-sm sm:w-auto"
            value={format(fromDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(event) => setFromDate(new Date(event.target.value))}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('toLabel')}</span>
          <Input
            type="datetime-local"
            placeholder={t('toPlaceholder')}
            className="flex-1 text-sm sm:w-auto"
            value={format(toDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(event) => setToDate(new Date(event.target.value))}
          />
        </div>
        <Button variant={'outline'} onClick={resetDateFilter} className="w-full sm:w-auto">
          {t('reset')}
        </Button>
        <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={setToday}>
            {t('today')}
          </Button>
          <Button variant="secondary" size="sm" onClick={setLast7Days}>
            {t('last7Days')}
          </Button>
          <Button variant="secondary" size="sm" onClick={setThisMonth}>
            {t('thisMonth')}
          </Button>
        </div>
      </div>

      {/* Stats cards - responsive grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>

            <div className="rounded-full bg-emerald-500/10 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-emerald-500"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-primary to-accent bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              {formatCurrency(revenue)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('customers')}</CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-blue-500"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-primary to-accent bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              {guestCount}
            </div>
            {/* <p className='text-xs text-muted-foreground'>Gọi món</p> */}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('orders')}</CardTitle>
            <div className="rounded-full bg-orange-500/10 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-orange-500"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-primary to-accent bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              {orderCount}
            </div>
            {/* <p className='text-xs text-muted-foreground'>Đã thanh toán</p> */}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tablesInUse')}</CardTitle>
            <div className="rounded-full bg-purple-500/10 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-purple-500"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-primary to-accent bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              {servingTableCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - responsive grid */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueLineChart chartData={revenueByDate} />
        </div>
        <div className="lg:col-span-3">
          <DishBarChart chartData={dishIndicator} />
        </div>
      </div>
    </div>
  )
}
