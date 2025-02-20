'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueLineChart } from '@/app/[locale]/manage/dashboard/revenue-line-chart'
import { DishBarChart } from '@/app/[locale]/manage/dashboard/dish-bar-chart'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { endOfDay, format, startOfDay } from 'date-fns'
import { useState } from 'react'
import { useDashboardIndicator } from '@/queries/useIndicator'

const initFromDate = startOfDay(new Date())
const initToDate = endOfDay(new Date())
export default function DashboardMain() {
  const [fromDate, setFromDate] = useState(initFromDate)
  const [toDate, setToDate] = useState(initToDate)
  const { data } = useDashboardIndicator({
    fromDate,
    toDate
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

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <div className='flex items-center'>
          <span className='mr-2'>Từ</span>
          <Input
            type='datetime-local'
            placeholder='Từ ngày'
            className='text-sm'
            value={format(fromDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(event) => setFromDate(new Date(event.target.value))}
          />
        </div>
        <div className='flex items-center'>
          <span className='mr-2'>Đến</span>
          <Input
            type='datetime-local'
            placeholder='Đến ngày'
            value={format(toDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(event) => setToDate(new Date(event.target.value))}
          />
        </div>
        <Button className='' variant={'outline'} onClick={resetDateFilter}>
          Reset
        </Button>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng doanh thu
            </CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Khách</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{guestCount}</div>
            <p className='text-xs text-muted-foreground'>Gọi món</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Đơn hàng</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <rect width='20' height='14' x='2' y='5' rx='2' />
              <path d='M2 10h20' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{orderCount}</div>
            {/* <p className='text-xs text-muted-foreground'>Đã thanh toán</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Bàn đang phục vụ
            </CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{servingTableCount}</div>
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='lg:col-span-4'>
          <RevenueLineChart chartData={revenueByDate} />
        </div>
        <div className='lg:col-span-3'>
          <DishBarChart chartData={dishIndicator} />
        </div>
      </div>
    </div>
  )
}
