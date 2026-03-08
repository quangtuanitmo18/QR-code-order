import prisma from '@/database'
import { couponService } from '@/services/coupon.service'
import { guestService } from '@/services/guest.service'
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
        'Place an order for dishes. IMPORTANT: You MUST confirm the order details (dish names, quantities, total price) with the customer BEFORE calling this tool. Only call this after the customer explicitly confirms. Accepts an array of items with dish names and quantities.',
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              dishName: z.string().describe('The name of the dish to order'),
              quantity: z.number().min(1).describe('How many of this dish to order')
            })
          )
          .min(1)
          .describe('Array of dishes to order with quantities')
      }),
      execute: async ({ items }: { items: Array<{ dishName: string; quantity: number }> }) => {
        const log = getContextLogger()
        try {
          if (!context.guestId) {
            return { message: 'Unable to identify your session. Please scan the QR code again to place an order.' }
          }

          // Resolve dish names to dish IDs
          const orderItems: Array<{ dishId: number; quantity: number }> = []
          const resolvedDishes: Array<{ name: string; price: number; quantity: number }> = []

          for (const item of items) {
            // Try exact match first (case-insensitive via SQLite LIKE default behavior)
            const exactMatches = await prisma.dish.findMany({
              where: {
                name: { contains: item.dishName.toLowerCase() },
                status: 'Available'
              },
              take: 10
            })

            // Filter for exact name match (case-insensitive)
            let dish = exactMatches.find((d) => d.name.toLowerCase() === item.dishName.toLowerCase()) || null

            // Fallback to partial match if exact match fails
            if (!dish) {
              const partialMatches = exactMatches

              if (partialMatches.length === 0) {
                return {
                  message: `Could not find dish "${item.dishName}". Please check the name and try again.`
                }
              }

              if (partialMatches.length > 1) {
                return {
                  message: `Multiple dishes match "${item.dishName}": ${partialMatches.map((d) => `"${d.name}" ($${d.price})`).join(', ')}. Please specify the exact dish name.`
                }
              }

              dish = partialMatches[0]
            }

            orderItems.push({ dishId: dish.id, quantity: item.quantity })
            resolvedDishes.push({ name: dish.name, price: dish.price, quantity: item.quantity })
          }

          // Place order using existing guest service
          const orders = await guestService.createOrders(context.guestId, orderItems)
          const createdOrder = orders[0]

          return {
            message: 'Order placed successfully! 🎉',
            orderId: createdOrder.id,
            status: createdOrder.status,
            items: resolvedDishes.map((d) => ({
              name: d.name,
              quantity: d.quantity,
              unitPrice: d.price,
              subtotal: d.price * d.quantity
            })),
            totalAmount: createdOrder.totalAmount
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          log?.error({ err: error }, '[AI Tool: placeOrder] Failed to place order')
          return { message: `Failed to place order: ${errorMessage}` }
        }
      }
    }),

    /**
     * Cancel a pending order.
     */
    cancelOrder: tool({
      description:
        'Cancel a pending order by order ID. IMPORTANT: You MUST confirm with the customer BEFORE calling this tool. Only orders with "Pending" status can be cancelled. Show the order details and ask for confirmation first.',
      inputSchema: z.object({
        orderId: z.number().describe('The order ID to cancel')
      }),
      execute: async ({ orderId }: { orderId: number }) => {
        const log = getContextLogger()
        try {
          if (!context.guestId) {
            return { message: 'Unable to identify your session. Please scan the QR code again.' }
          }

          const result = await guestService.cancelOrder(orderId, context.guestId)
          return { message: `Order #${orderId} has been cancelled successfully.`, ...result }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          log?.error({ err: error }, '[AI Tool: cancelOrder] Failed to cancel order')
          return { message: errorMessage }
        }
      }
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
      }),
      execute: async ({ couponCode, orderId }: { couponCode: string; orderId: number }) => {
        const log = getContextLogger()
        try {
          if (!context.guestId) {
            return { message: 'Unable to identify your session. Please scan the QR code again.' }
          }

          const result = await couponService.applyToOrder(couponCode, orderId, context.guestId)
          return { message: `Coupon "${couponCode}" applied successfully! 🎉`, ...result }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          log?.error({ err: error }, '[AI Tool: applyCoupon] Failed to apply coupon')
          return { message: `Failed to apply coupon: ${errorMessage}` }
        }
      }
    })
  }
}
