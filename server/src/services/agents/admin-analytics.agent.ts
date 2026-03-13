import { adminService } from '@/services/admin.service'
import { getContextLogger } from '@/utils/logger'
import { tool } from 'ai'
import { z } from 'zod'

export function createAdminAnalyticsAgentTools(context: { accountId?: number }) {
  const authGuard = () => {
    if (!context.accountId) return { message: 'Unauthorized. Admin context missing.' }
    return null
  }

  return {
    /**
     * Get Revenue Trends
     */
    admin_get_revenue_trends: tool({
      description:
        'Get revenue trends for the restaurant over a specific time range. Use this when the owner asks about revenue, sales, or income.',
      inputSchema: z.object({
        startDate: z.string().describe('ISO 8601 date string for the start of the range (e.g., 2026-03-01T00:00:00Z)'),
        endDate: z.string().describe('ISO 8601 date string for the end of the range (e.g., 2026-03-14T00:00:00Z)')
      }),
      execute: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
        const log = getContextLogger()
        const denied = authGuard()
        if (denied) return denied
        try {
          return await adminService.getRevenueTrends(startDate, endDate)
        } catch (error) {
          log?.error({ err: error }, '[Admin AI Tool: getRevenueTrends] error')
          return { message: 'Failed to retrieve revenue data.' }
        }
      }
    }),

    /**
     * Get Dish Performance
     */
    admin_get_dish_performance: tool({
      description:
        'Get the best or worst performing dishes based on order volume. Use this when the owner asks about top-selling or worst-selling items.',
      inputSchema: z.object({
        sortBy: z.enum(['best', 'worst']).describe('Whether to sort by best selling or worst selling'),
        limit: z.number().min(1).max(20).default(5).describe('Number of items to return')
      }),
      execute: async ({ sortBy, limit }: { sortBy: 'best' | 'worst'; limit: number }) => {
        const log = getContextLogger()
        const denied = authGuard()
        if (denied) return denied
        try {
          return await adminService.getDishPerformance(sortBy, limit)
        } catch (error) {
          log?.error({ err: error }, '[Admin AI Tool: getDishPerformance] error')
          return { message: 'Failed to retrieve dish performance.' }
        }
      }
    })
  }
}
