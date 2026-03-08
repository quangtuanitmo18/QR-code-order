import prisma from '@/database'
import { chromaService } from '@/services/chroma.service'
import { embeddingService } from '@/services/embedding.service'
import { getContextLogger } from '@/utils/logger'
import { tool } from 'ai'
import { z } from 'zod'

export function createFaqAgentTools() {
  return {
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
    })
  }
}
