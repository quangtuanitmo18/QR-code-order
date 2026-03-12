import prisma from '@/database'
import { hybridRagService } from '@/services/hybrid-rag.service'
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
     * Hybrid FAQ search — 4-layer lightweight pipeline:
     * Normalize → Light Expansion → [SQL + Vector] → Simple Rerank + Log
     */
    searchFAQ: tool({
      description:
        'Search restaurant FAQs using hybrid keyword + semantic search. Use when a customer asks general questions about the restaurant like parking, reservations, delivery, payment methods, allergies, dress code, etc.',
      inputSchema: z.object({
        query: z.string().describe('The customer question about the restaurant')
      }),
      execute: async ({ query }: { query: string }) => {
        const log = getContextLogger()
        try {
          const results = await hybridRagService.searchFAQ(query)

          if (results.length === 0) {
            // Fallback: return all FAQs if hybrid found nothing
            const faqs = await prisma.fAQ.findMany({ where: { isActive: true }, take: 5 })
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

          return results.map((r) => ({
            question: r.question,
            answer: r.answer,
            category: r.category,
            score: r.score,
            source: r.source
          }))
        } catch (error) {
          log?.warn({ err: error }, '[AI Tool: searchFAQ] Hybrid search failed, trying SQL fallback')
          try {
            const faqs = await prisma.fAQ.findMany({ where: { isActive: true }, take: 5 })
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
