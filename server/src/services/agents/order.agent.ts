import prisma from '@/database'
import { couponService } from '@/services/coupon.service'
import { getContextLogger } from '@/utils/logger'
import { tool } from 'ai'
import { z } from 'zod'

export function createOrderAgentTools(context: { guestId?: number }) {
  return {
    /**
     * Get current guest's order status.
     */
    getOrderStatus: tool({
      description:
        "Get the current guest's order status including all items, quantities, prices, and order status. Use when a customer asks about their order, bill, or what they've ordered.",
      inputSchema: z.object({}),
      execute: async () => {
        const log = getContextLogger()
        try {
          if (!context.guestId) {
            return { message: 'Unable to identify your session. Please scan the QR code again.' }
          }

          const orders = await prisma.order.findMany({
            where: { guestId: context.guestId },
            include: {
              items: {
                include: {
                  dishSnapshot: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })

          if (orders.length === 0) {
            return { message: "You haven't placed any orders yet. Would you like to see our menu?" }
          }

          return orders.map((order) => ({
            orderId: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt.toISOString(),
            items: order.items.map((item) => ({
              name: item.dishSnapshot.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          }))
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: getOrderStatus] Database error')
          return { message: 'Failed to retrieve order status. Please try again.' }
        }
      }
    }),

    /**
     * Get currently available coupons for this guest.
     */
    getAvailableCoupons: tool({
      description:
        'Get all currently active coupons and promotions available for this customer. Filters out coupons the customer has already used up. Use when a customer asks about discounts, promotions, deals, or coupons.',
      inputSchema: z.object({}),
      execute: async () => {
        const log = getContextLogger()
        try {
          if (!context.guestId) {
            return { message: 'Coupons are only available when logged into a table session.' }
          }
          const coupons = await couponService.getAvailableForGuest(context.guestId)
          if (coupons.length === 0) {
            return { message: 'No coupons available for you at the moment. Check back soon!' }
          }
          return coupons
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: getAvailableCoupons] Database error')
          return { message: 'Failed to retrieve coupons. Please try again.' }
        }
      }
    }),

    /**
     * Place an order for the guest.
     */
    placeOrder: tool({
      description:
        'Place an order for dishes. CRITICAL RULES: (1) ALWAYS call searchMenuSemantic or searchMenu FIRST to get dish IDs before ordering. (2) ALWAYS include the "dishId" field (numeric database ID) from search results for each item — NEVER place an order without it. (3) Only call this tool AFTER the customer explicitly confirms order details. The dishName is only for display purposes; dishId is what actually identifies the dish in the system.',
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              dishId: z
                .number()
                .describe(
                  'REQUIRED: The numeric database ID of the dish returned by searchMenuSemantic or searchMenu. YOU MUST always include this — never omit it.'
                ),
              dishName: z.string().describe('The display name shown to the customer (for confirmation UI only)'),
              quantity: z.number().min(1).describe('How many of this dish to order')
            })
          )
          .min(1)
          .describe('Array of dishes to order. Each item MUST have dishId from search results.')
      })
      // No execute — HITL: frontend will handle execution via REST API
    }),

    /**
     * Cancel a pending order.
     */
    cancelOrder: tool({
      description:
        'Cancel a pending order by order ID. IMPORTANT: You MUST confirm with the customer BEFORE calling this tool. Only orders with "Pending" status can be cancelled. Show the order details and ask for confirmation first.',
      inputSchema: z.object({
        orderId: z.number().describe('The order ID to cancel')
      })
      // No execute — HITL: frontend will handle execution via REST API
    }),

    /**
     * Apply a coupon code to a pending order.
     */
    applyCoupon: tool({
      description:
        'Apply a coupon/discount code to a pending order. IMPORTANT: You MUST confirm with the customer BEFORE calling this tool. Show the coupon details and estimated discount first. Only works on pending orders.',
      inputSchema: z.object({
        couponCode: z.string().describe('The coupon code to apply (e.g., "WELCOME10")'),
        orderId: z.number().describe('The order ID to apply the coupon to')
      })
      // No execute — HITL: frontend will handle execution via REST API
    })
  }
}
