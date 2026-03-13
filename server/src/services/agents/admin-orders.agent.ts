import { adminService } from '@/services/admin.service'
import { getContextLogger } from '@/utils/logger'
import { tool } from 'ai'
import { z } from 'zod'

export function createAdminOrdersAgentTools(context: { accountId?: number }) {
  const authGuard = () => {
    if (!context.accountId) return { message: 'Unauthorized. Admin context missing.' }
    return null
  }

  return {
    /**
     * Search Historical Orders
     */
    admin_search_orders: tool({
      description:
        'Search historical orders based on specific criteria (e.g., table number, date, guest name, status). Use this when the owner asks about past orders, complaints ("yesterday at table 2"), or specific order histories.',
      inputSchema: z.object({
        tableNumber: z.number().optional().describe('Filter by table number'),
        startDate: z.string().optional().describe('ISO 8601 date string for start of range'),
        endDate: z.string().optional().describe('ISO 8601 date string for end of range'),
        guestName: z.string().optional().describe('Partial match for guest name'),
        status: z.string().optional().describe('Filter by order status (e.g., Pending, Paid, Rejected)'),
        limit: z.number().min(1).max(20).default(10).describe('Max results to return (default 10)')
      }),
      execute: async (filters: {
        tableNumber?: number
        startDate?: string
        endDate?: string
        guestName?: string
        status?: string
        limit?: number
      }) => {
        const log = getContextLogger()
        const denied = authGuard()
        if (denied) return denied
        try {
          return await adminService.searchOrders(filters)
        } catch (error) {
          log?.error({ err: error }, '[Admin AI Tool: admin_search_orders] error')
          return { message: 'Failed to search orders.' }
        }
      }
    }),

    /**
     * Cancel Order (Admin Force)
     * NO execute — triggers HITL confirmation in the frontend.
     * The frontend will call the REST endpoint to execute.
     */
    admin_cancel_order: tool({
      description:
        'Force cancel any order by order ID. Call this tool directly when the owner wants to cancel — the system will show a confirmation dialog before executing.',
      inputSchema: z.object({
        orderId: z.number().describe('The order ID to cancel'),
        reason: z.string().describe('Reason for cancellation')
      })
      // No execute — HITL: frontend will handle execution via REST API
    }),

    /**
     * Get Live Orders
     */
    admin_get_live_orders: tool({
      description:
        'Get the count and details of currently active/pending orders and tables. Use this when the admin wants a live overview of the restaurant floor.',
      inputSchema: z.object({}),
      execute: async () => {
        const log = getContextLogger()
        const denied = authGuard()
        if (denied) return denied
        try {
          return await adminService.getLiveOrders()
        } catch (error) {
          log?.error({ err: error }, '[Admin AI Tool: getLiveOrders] error')
          return { message: 'Failed to fetch live status.' }
        }
      }
    })
  }
}
