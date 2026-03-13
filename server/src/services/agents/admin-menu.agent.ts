import { tool } from 'ai'
import { z } from 'zod'

export function createAdminMenuAgentTools(context: { accountId?: number }) {
  return {
    /**
     * Update Dish Status or Price
     * NO execute — triggers HITL confirmation in the frontend.
     * The frontend will call the REST endpoint to execute.
     */
    admin_update_dish: tool({
      description:
        'Update a dish\'s status (e.g., to "Available" or "Unavailable") or price. Call this tool directly — the system will show a confirmation dialog before executing.',
      inputSchema: z.object({
        dishId: z.number().describe('The ID of the dish to update'),
        updates: z
          .object({
            status: z.enum(['Available', 'Unavailable', 'Hidden']).optional(),
            price: z.number().optional()
          })
          .describe('The fields to update')
      })
      // No execute — HITL: frontend will handle execution via REST API
    })
  }
}
