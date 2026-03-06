import prisma from '@/database'
import { chromaService } from '@/services/chroma.service'
import { embeddingService } from '@/services/embedding.service'
import { tool } from 'ai'
import { z } from 'zod'

export const aiTools = {
  /**
   * SQL-based search (fast, exact match via SQLite LIKE).
   * Best for: exact dish names, specific categories.
   */
  searchMenu: tool({
    description:
      'Search the restaurant menu by exact dish name, category, or tags using database lookup. Best for specific queries like "phở bò" or "Appetizers". Returns dishes with price, description, and allergen info.',
    inputSchema: z.object({
      query: z.string().describe('The search query (e.g., "beef", "Appetizers", "spicy", "phở bò")')
    }),
    execute: async ({ query }: { query: string }) => {
      try {
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
          take: 5
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
      } catch (error) {
        console.error('[AI Tool: searchMenu] Database error:', error)
        return { message: 'Failed to search menu. Please try again.' }
      }
    }
  }),

  /**
   * RAG semantic search via ChromaDB (understands meaning, multilingual).
   * Best for: vague queries, dietary preferences, multilingual questions.
   */
  searchMenuSemantic: tool({
    description:
      'Semantic search for dishes using AI-powered understanding. Best for vague, descriptive, or multilingual queries like "something light", "ăn vặt", "vegetarian food", or "good with beer". Understands meaning, not just keywords.',
    inputSchema: z.object({
      query: z.string().describe('Natural language food query in any language')
    }),
    execute: async ({ query }: { query: string }) => {
      try {
        // 1. Create embedding for the user's query
        const queryEmbedding = await embeddingService.createQueryEmbedding(query)

        // 2. Semantic search in ChromaDB
        const results = await chromaService.queryDocuments(queryEmbedding, 5)

        if (!results.documents?.[0]?.length) {
          return { message: `No semantic matches found for "${query}". Try searchMenu for exact keywords.` }
        }

        // 3. Format results with metadata and similarity scores
        return results.documents[0].map((doc: string | null, i: number) => ({
          text: doc,
          metadata: results.metadatas?.[0]?.[i] || {},
          distance: results.distances?.[0]?.[i] ?? null
        }))
      } catch (error) {
        console.error('[AI Tool: searchMenuSemantic] Error:', error)
        return { message: 'Semantic search failed. Trying regular search instead.' }
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
        console.error('[AI Tool: getDishDetails] Database error:', error)
        return { message: 'Failed to get dish details. Please try again.' }
      }
    }
  })
}
