'use client'

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'
import { UtensilsCrossed } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import { useTranslations } from 'next-intl'

export function DishBarChart({
  chartData,
}: {
  chartData: Pick<DashboardIndicatorResType['data']['dishIndicator'][0], 'name' | 'successOrders'>[]
}) {
  const t = useTranslations('DashboardMain')

  const chartConfig = {
    successOrders: {
      label: t('paidOrders'),
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dishRanking')}</CardTitle>
        <CardDescription>{t('mostOrdered')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex aspect-auto h-[250px] w-full flex-col items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="mb-4 h-12 w-12 opacity-20" />
            <p className="font-medium">{t('noDishes')}</p>
            <p className="text-sm opacity-70">{t('noDishesDesc')}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                left: 0,
                right: 30, // Extra space for value labels
              }}
            >
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={120} // Fixed width to ensure long text doesn't push bars off and aligns uniformly
                tickFormatter={(value) => {
                  return value.length > 20 ? value.substring(0, 20) + '...' : value
                }}
              />
              <XAxis dataKey="successOrders" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar 
                dataKey="successOrders" 
                fill="var(--color-successOrders)" 
                radius={[0, 4, 4, 0]}
                barSize={32}
              >
                <LabelList 
                  dataKey="successOrders" 
                  position="right" 
                  offset={8} 
                  className="fill-foreground font-semibold" 
                  fontSize={12} 
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
