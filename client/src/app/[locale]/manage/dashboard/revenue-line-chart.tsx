'use client'

import { TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { format, parse } from 'date-fns'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))'
  }
} satisfies ChartConfig

export function RevenueLineChart({
  chartData
}: {
  chartData: DashboardIndicatorResType['data']['revenueByDate']
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dashed' />}
            />
            <Line
              dataKey='revenue'
              name='Doanh thu'
              type='linear'
              stroke='var(--color-desktop)'
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col items-start gap-2 text-sm'>
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
