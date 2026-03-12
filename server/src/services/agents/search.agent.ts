import prisma from '@/database'
import { hybridRagService } from '@/services/hybrid-rag.service'
import { getContextLogger } from '@/utils/logger'
import { tool } from 'ai'
import { z } from 'zod'

/**
 * Shared SQL search logic — reusable by both searchMenu and searchMenuSemantic (fallback).
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

export function createSearchAgentTools() {
  return {
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
     * Hybrid RAG search — 5-layer pipeline: Normalize → Entity Extract → Expand → Hybrid Retrieve → Rerank + Log.
     * Uses synonym expansion, catalog expansion, SQL + Vector + structured filter concurrently.
     */
    searchMenuSemantic: tool({
      description:
        'Hybrid AI-powered menu search combining keyword, semantic, and entity-based search. Best for any food query — exact names like "Big Boy Burger", vague like "something light", multilingual, or category-based like "appetizers". Understands meaning, synonyms, ingredients, and allergens.',
      inputSchema: z.object({
        query: z.string().describe('Natural language food query in any language')
      }),
      execute: async ({ query }: { query: string }) => {
        const log = getContextLogger()
        try {
          const results = await hybridRagService.searchMenu(query)

          if (results.length === 0) {
            log?.info(`[AI Tool: searchMenuSemantic] No hybrid results for "${query}", falling back to SQL`)
            return await sqlSearchDishes(query)
          }

          return results.map((r) => ({
            id: r.id,
            name: r.name,
            price: r.price,
            description: r.description,
            category: r.category,
            ingredients: r.ingredients,
            allergens: r.allergens,
            tags: r.tags,
            score: r.score,
            source: r.source
          }))
        } catch (error) {
          log?.warn({ err: error }, '[AI Tool: searchMenuSemantic] Hybrid RAG failed, falling back to SQL')
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
     * Get currently available coupons for this guest (can be asked during search).
     */
    getAvailableCoupons: tool({
      description:
        'Get all currently active coupons and promotions available for this customer. Filters out coupons the customer has already used up. Use when a customer asks about discounts, promotions, deals, or coupons.',
      inputSchema: z.object({}),
      execute: async () => {
        const log = getContextLogger()
        try {
          // NOTE: We need guestId to be injected here somehow if we extract this.
          // For now, let's assume search doesn't strictly need auth'd coupon lookup,
          // OR we must pass context to this agent factory too.
          // Returning a placeholder error if context is missing, but to fix properly,
          // createSearchAgentTools must accept (context: { guestId?: number })
          return {
            message:
              'Coupons require you to be logged into your table session. Please use the Order tools to view coupons.'
          }
        } catch (error) {
          log?.error({ err: error }, '[AI Tool: getAvailableCoupons] Database error')
          return { message: 'Failed to retrieve coupons. Please try again.' }
        }
      }
    })
  }
}
