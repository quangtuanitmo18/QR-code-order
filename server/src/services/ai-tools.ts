import prisma from '@/database'
import { chromaService } from '@/services/chroma.service'
import { couponService } from '@/services/coupon.service'
import { embeddingService } from '@/services/embedding.service'
import { guestService } from '@/services/guest.service'
import { getContextLogger } from '@/utils/logger'
import { tool } from 'ai'
import { z } from 'zod'

/**
 * @deprecated LEGACY FILE — NOT USED IN PRODUCTION
 *
 * This file was the original monolithic tool registry before the codebase was
 * refactored into dedicated agent files (search.agent.ts, order.agent.ts, faq.agent.ts).
 *
 * It is currently ONLY used by the eval script:
 *   src/scripts/eval-ai.ts
 *
 * Production tool registration happens in:
 *   - src/services/agents/search.agent.ts  → searchMenu, searchMenuSemantic, getDishDetails, getMenuCategories, getPopularDishes
 *   - src/services/agents/order.agent.ts   → placeOrder, cancelOrder, applyCoupon, getOrderStatus, getAvailableCoupons
 *   - src/services/agents/faq.agent.ts     → searchFAQ, getRestaurantInfo
 */

async function sqlSearchDishes(query: string, take = 5) {
  const lowerQuery = query.toLowerCase()
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: lowerQuery } },
        { category: { contains: lowerQuery } },
        { tags: { contains: lowerQuery } }
      ],
      status: 'Available'
    },
    take
  })

  if (dishes.length === 0) {
    return { message: `No dishes found matching "${query}". Try a different keyword.` }
  }

  return dishes.map((d) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    description: d.description,
    category: d.category,
    ingredients: d.ingredients || 'Not specified',
    allergens: d.allergens || 'None',
    tags: d.tags || 'None'
  }))
}

/**
 * Factory function that creates AI tools with runtime context.
 * guestId is needed for tools like getOrderStatus.
 */
export function createAiTools(context: { guestId?: number }) {
  return {
    // ─── EXISTING TOOLS ───────────────────────────────────────

    /**
     * SQL-based search (fast, exact match via SQLite LIKE).
     */
    searchMenu: tool({
      description:
        'Search the restaurant menu by exact dish name, category, or tags using database lookup. Best for specific queries like "Spring Rolls" or "Appetizers". Returns dishes with price, description, and allergen info.',
      inputSchema: z.object({
        query: z.string().describe('The search query (e.g., "beef", "Appetizers", "spicy")')
      }),
      execute: async ({ query }: { query: string }) => {
        const log = getContextLogger()
        try {
          return await sqlSearchDishes(query)
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: searchMenu] Database error')
          return { message: 'Failed to search menu. Please try again.' }
        }
      }
    }),

    /**
     * RAG semantic search via ChromaDB (understands meaning, multilingual).
     */
    searchMenuSemantic: tool({
      description:
        'Semantic search for dishes using AI-powered understanding. Best for vague, descriptive, or multilingual queries like "something light", "vegetarian food", or "good with beer". Understands meaning, not just keywords.',
      inputSchema: z.object({
        query: z.string().describe('Natural language food query in any language')
      }),
      execute: async ({ query }: { query: string }) => {
        const log = getContextLogger()
        try {
          const queryEmbedding = await embeddingService.createQueryEmbedding(query)
          const results = await chromaService.queryDocuments(queryEmbedding, 5, 'restaurant_menu')

          if (!results.documents?.[0]?.length) {
            log?.info(`[AI Tool: searchMenuSemantic] No RAG results for "${query}", falling back to SQL`)
            return await sqlSearchDishes(query)
          }

          return results.documents[0].map((_doc: string | null, i: number) => {
            const meta = results.metadatas?.[0]?.[i] || ({} as Record<string, string>)
            return {
              id: meta.dishId ? Number(meta.dishId) : null,
              name: meta.name || '',
              price: meta.price ? Number(meta.price) : null,
              category: meta.category || '',
              ingredients: meta.ingredients || 'Not specified',
              allergens: meta.allergens || 'None',
              tags: meta.tags || 'None',
              distance: results.distances?.[0]?.[i] ?? null
            }
          })
        } catch (error) {
          log?.warn({ err: error }, '[AI Tool: searchMenuSemantic] RAG failed, falling back to SQL search')
          try {
            return await sqlSearchDishes(query)
          } catch (fallbackError) {
            log?.error({ err: fallbackError }, '[AI Tool: searchMenuSemantic] SQL fallback also failed')
            return { message: 'Search is temporarily unavailable. Please try again later.' }
          }
        }
      }
    }),

    /**
     * Get detailed info about a specific dish.
     */
    getDishDetails: tool({
      description:
        'Get detailed information about a specific dish by name, including ingredients and allergens. Use when a customer asks about a specific dish.',
      inputSchema: z.object({
        dishName: z.string().describe('The name of the dish to get details for')
      }),
      execute: async ({ dishName }: { dishName: string }) => {
        const log = getContextLogger()
        try {
          const dish = await prisma.dish.findFirst({
            where: {
              name: { contains: dishName.toLowerCase() },
              status: 'Available'
            }
          })

          if (!dish) {
            return { message: `Dish "${dishName}" not found or not currently available.` }
          }

          return {
            id: dish.id,
            name: dish.name,
            price: dish.price,
            description: dish.description,
            category: dish.category,
            ingredients: dish.ingredients || 'Not specified',
            allergens: dish.allergens || 'None',
            tags: dish.tags || 'None'
          }
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: getDishDetails] Database error')
          return { message: 'Failed to get dish details. Please try again.' }
        }
      }
    }),

    // ─── NEW TOOLS ────────────────────────────────────────────

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
     * Get restaurant information from settings.
     */
    getRestaurantInfo: tool({
      description:
        'Get restaurant information including opening hours, address, contact details, policies, and WiFi password. Use when a customer asks about the restaurant, hours, location, parking, WiFi, dress code, or policies.',
      inputSchema: z.object({}),
      execute: async () => {
        const log = getContextLogger()
        try {
          const settings = await prisma.restaurantSetting.findMany()

          if (settings.length === 0) {
            return { message: 'Restaurant information is currently unavailable.' }
          }

          const info: Record<string, string> = {}
          for (const s of settings) {
            info[s.key] = s.value
          }

          return info
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: getRestaurantInfo] Database error')
          return { message: 'Failed to retrieve restaurant info. Please try again.' }
        }
      }
    }),

    /**
     * Get all menu categories with dish counts.
     */
    getMenuCategories: tool({
      description:
        'Get all menu categories with descriptions and the number of available dishes in each. Use when a customer asks what types of food are available or wants to browse by category.',
      inputSchema: z.object({}),
      execute: async () => {
        const log = getContextLogger()
        try {
          const categories = await prisma.dishCategory.findMany({
            orderBy: { name: 'asc' }
          })

          // Count available dishes per category
          const dishCounts = await prisma.dish.groupBy({
            by: ['category'],
            where: { status: 'Available' },
            _count: { id: true }
          })

          const countMap = new Map(dishCounts.map((dc) => [dc.category, dc._count.id]))

          return categories.map((cat) => ({
            name: cat.name,
            description: cat.description || '',
            dishCount: countMap.get(cat.name) || 0
          }))
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: getMenuCategories] Database error')
          return { message: 'Failed to retrieve categories. Please try again.' }
        }
      }
    }),

    /**
     * Get most popular dishes by order count.
     */
    getPopularDishes: tool({
      description:
        'Get the most popular dishes ranked by how many times they have been ordered. Use when a customer asks for recommendations, best sellers, or what other people are ordering.',
      inputSchema: z.object({
        limit: z.number().min(1).max(20).optional().default(5).describe('Number of top dishes to return (default 5)')
      }),
      execute: async ({ limit }: { limit: number }) => {
        const log = getContextLogger()
        try {
          // Group order items by dish snapshot, sum quantities
          const popularItems = await prisma.orderItem.groupBy({
            by: ['dishSnapshotId'],
            where: {
              order: {
                status: {
                  not: 'Rejected'
                }
              }
            },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit
          })

          if (popularItems.length === 0) {
            return { message: 'No order data available yet. Try browsing our menu instead!' }
          }

          // Fetch dish details for the popular items
          const snapshotIds = popularItems.map((item) => item.dishSnapshotId)
          const snapshots = await prisma.dishSnapshot.findMany({
            where: { id: { in: snapshotIds } }
          })

          const snapshotMap = new Map(snapshots.map((s) => [s.id, s]))

          return popularItems
            .map((item) => {
              const snap = snapshotMap.get(item.dishSnapshotId)
              if (!snap) return null
              return {
                id: snap.dishId,
                name: snap.name,
                category: snap.category,
                price: snap.price,
                description: snap.description,
                totalOrdered: item._sum.quantity || 0
              }
            })
            .filter(Boolean)
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: getPopularDishes] Database error')
          return { message: 'Failed to retrieve popular dishes. Please try again.' }
        }
      }
    }),

    /**
     * Semantic search FAQs via ChromaDB restaurant_faq collection.
     */
    searchFAQ: tool({
      description:
        'Search restaurant FAQs using semantic understanding. Use when a customer asks general questions about the restaurant like parking, reservations, delivery, payment methods, allergies, dress code, etc.',
      inputSchema: z.object({
        query: z.string().describe('The customer question about the restaurant')
      }),
      execute: async ({ query }: { query: string }) => {
        const log = getContextLogger()
        try {
          const queryEmbedding = await embeddingService.createQueryEmbedding(query)
          const results = await chromaService.queryDocuments(queryEmbedding, 3, 'restaurant_faq')

          if (!results.documents?.[0]?.length) {
            // Fallback: try SQL search on FAQ table
            const faqs = await prisma.fAQ.findMany({
              where: {
                OR: [{ question: { contains: query.toLowerCase() } }, { answer: { contains: query.toLowerCase() } }]
              },
              take: 3
            })

            if (faqs.length === 0) {
              return {
                message: "I couldn't find a specific answer to that question. Please ask our staff for more details."
              }
            }

            return faqs.map((f) => ({
              question: f.question,
              answer: f.answer,
              category: f.category || ''
            }))
          }

          return results.documents[0].map((_doc: string | null, i: number) => {
            const meta = results.metadatas?.[0]?.[i] || {}
            return {
              question: meta.question || '',
              answer: meta.answer || '',
              category: meta.category || '',
              relevance: results.distances?.[0]?.[i] ?? null
            }
          })
        } catch (error) {
          log?.warn({ err: error }, '[AI Tool: searchFAQ] Semantic search failed, trying SQL fallback')
          try {
            const faqs = await prisma.fAQ.findMany({ take: 5 })
            return faqs.map((f) => ({
              question: f.question,
              answer: f.answer,
              category: f.category || ''
            }))
          } catch (fallbackError) {
            log?.error({ err: fallbackError }, '[AI Tool: searchFAQ] SQL fallback also failed')
            return { message: 'FAQ search is temporarily unavailable. Please try again later.' }
          }
        }
      }
    }),

    // ─── ORDER MANAGEMENT TOOLS ───────────────────────────────

    /**
     * Place an order for the guest.
     * The AI should ALWAYS confirm the order details with the user BEFORE calling this tool.
     * Example flow: User says "I want 2 Spring Rolls" → AI responds "I'll order 2 Spring Rolls ($18). Shall I confirm?" → User says "yes" → AI calls this tool.
     */
    placeOrder: tool({
      description:
        'Place an order for dishes. IMPORTANT: You MUST confirm the order details (dish names, quantities, total price) with the customer BEFORE calling this tool. Only call this after the customer explicitly confirms. Accepts an array of items with dish names and quantities.',
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              dishId: z
                .number()
                .optional()
                .describe(
                  'The database ID of the dish from search results. Use this when available for reliable lookup.'
                ),
              dishName: z.string().describe('The display name of the dish (used as fallback if dishId is unavailable)'),
              quantity: z.number().min(1).describe('How many of this dish to order')
            })
          )
          .min(1)
          .describe('Array of dishes to order with quantities')
      }),
      execute: async ({ items }: { items: Array<{ dishId?: number; dishName: string; quantity: number }> }) => {
        const log = getContextLogger()
        try {
          if (!context.guestId) {
            return { message: 'Unable to identify your session. Please scan the QR code again to place an order.' }
          }

          // Resolve dish names to dish IDs
          const orderItems: Array<{ dishId: number; quantity: number }> = []
          const resolvedDishes: Array<{ name: string; price: number; quantity: number }> = []

          for (const item of items) {
            let dish = null

            // ID-first lookup: reliable even when AI uses translated/semantic names
            if (item.dishId) {
              dish = await prisma.dish.findFirst({
                where: { id: item.dishId, status: 'Available' }
              })
            }

            // Fallback: name-based lookup if no dishId or ID lookup failed
            if (!dish) {
              const matches = await prisma.dish.findMany({
                where: {
                  name: { contains: item.dishName, mode: 'insensitive' },
                  status: 'Available'
                },
                take: 10
              })

              dish = matches.find((d) => d.name.toLowerCase() === item.dishName.toLowerCase()) || null

              if (!dish) {
                if (matches.length === 0) {
                  return {
                    message: `Could not find dish "${item.dishName}". Please check the name and try again.`
                  }
                }
                if (matches.length > 1) {
                  return {
                    message: `Multiple dishes match "${item.dishName}": ${matches.map((d) => `"${d.name}" ($${d.price})`).join(', ')}. Please specify.`
                  }
                }
                dish = matches[0]
              }
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
     * The AI should ALWAYS confirm with the user BEFORE calling this tool.
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
     * The AI should confirm the coupon details with the user BEFORE calling this tool.
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
