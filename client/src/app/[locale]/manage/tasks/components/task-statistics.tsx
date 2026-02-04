'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTaskStatisticsQuery } from '@/queries/useTask'
import { BarChart3, CheckCircle2, Clock, ListTodo } from 'lucide-react'

export function TaskStatistics() {
  // Fetch statistics without any filters (total counts) - dedicated API endpoint
  const { data, isLoading } = useGetTaskStatisticsQuery()

  const statistics = data?.payload.data || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  }

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{statistics.total}</span>
                <span className="flex items-center gap-0.5 text-sm text-green-500"></span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <ListTodo className="size-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{statistics.completed}</span>
                <span className="flex items-center gap-0.5 text-sm text-green-500"></span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{statistics.inProgress}</span>
                <span className="flex items-center gap-0.5 text-sm text-green-500"></span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <Clock className="size-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{statistics.pending}</span>
                <span className="flex items-center gap-0.5 text-sm text-orange-500"></span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <BarChart3 className="size-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
