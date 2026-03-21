'use client'

import { TrendingUp, ReceiptText } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { format, parse } from 'date-fns'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import { useTranslations } from 'next-intl'
const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function RevenueLineChart({
  chartData,
}: {
  chartData: DashboardIndicatorResType['data']['revenueByDate']
}) {
  const t = useTranslations('DashboardMain')
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('revenue')}</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex aspect-auto h-[250px] w-full flex-col items-center justify-center text-muted-foreground">
            <ReceiptText className="mb-4 h-12 w-12 opacity-20" />
            <p className="font-medium">{t('noRevenueData')}</p>
            <p className="text-sm opacity-70">{t('tryDifferentDate')}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
              }}
            >
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (chartData.length < 8) {
                    return value
                  }
                  if (chartData.length < 33) {
                    const date = parse(value, 'dd/MM/yyyy', new Date())
                    return format(date, 'dd')
                  }
                  return ''
                }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Area
                dataKey="revenue"
                name="Revenue"
                type="monotone"
                fill="url(#fillDesktop)"
                fillOpacity={0.4}
                stroke="var(--color-desktop)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {/* <div className='flex gap-2 font-medium leading-none'>
          Trending up by 5.2% this month <TrendingUp className='h-4 w-4' />
        </div>
        <div className='leading-none text-muted-foreground'>
          Showing total visitors for the last 6 months
        </div> */}
      </CardFooter>
    </Card>
  )
}
