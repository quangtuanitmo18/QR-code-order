import prisma from '@/database'
import { tool } from 'ai'
import { z } from 'zod'

export const aiTools = {
  searchMenu: tool({
    description:
      'Search the restaurant menu by dish name, category, or tags. Returns a list of matching dishes with their details.',
    inputSchema: z.object({
      query: z.string().describe('The search query (e.g., "beef", "Appetizers", "spicy")')
    }),
    execute: async ({ query }: { query: string }) => {
      const dishes = await prisma.dish.findMany({
        where: {
          OR: [{ name: { contains: query } }, { category: { contains: query } }, { tags: { contains: query } }],
          status: 'Available'
        },
        take: 5
      })

      if (dishes.length === 0) {
        return { message: `No dishes found matching "${query}".` }
      }

      return dishes.map((d) => ({
        id: d.id,
        name: d.name,
        price: d.price,
        description: d.description,
        category: d.category,
        ingredients: d.ingredients,
        allergens: d.allergens,
        tags: d.tags
      }))
    }
  }),

  getDishDetails: tool({
    description: 'Get detailed information about a specific dish, especially to check ingredients or allergens.',
    inputSchema: z.object({
      dishName: z.string().describe('The name of the dish to get details for')
    }),
    execute: async ({ dishName }: { dishName: string }) => {
      const dish = await prisma.dish.findFirst({
        where: {
          name: {
            contains: dishName
          },
          status: 'Available'
        }
      })

      if (!dish) {
        return { message: `Dish "${dishName}" not found.` }
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
    }
  })
}
