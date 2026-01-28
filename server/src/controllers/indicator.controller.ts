import { indicatorService } from '@/services/indicator.service'

export const dashboardIndicatorController = async ({ fromDate, toDate }: { fromDate: Date; toDate: Date }) => {
  return await indicatorService.getDashboardIndicators({ fromDate, toDate })
}
