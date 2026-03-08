import envConfig from '@/config'
import { getContextLogger } from '@/utils/logger'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject } from 'ai'
import { z } from 'zod'
import { UIMessageLike } from './ai-memory.service'

/**
 * Define the possible intents for our specialized sub-agents.
 */
export const IntentSchema = z.object({
  intent: z
    .enum(['SEARCH', 'ORDER', 'FAQ', 'GENERAL'])
    .describe(
      'The primary intent of the user. Choose SEARCH for looking up menu items, prices, or ingredients. Choose ORDER for adding to cart, placing orders, or checkout status. Choose FAQ for restaurant info like hours, location, or wifi. Choose GENERAL for greetings or out-of-scope topics.'
    ),
  confidence: z.number().min(0).max(1).describe('Confidence score of the intent classification from 0 to 1.'),
  reasoning: z.string().describe('A very brief 1-sentence reason for choosing this intent.')
})

export type AgentIntent = z.infer<typeof IntentSchema>['intent']

class AiRouterService {
  /**
   * Evaluates the recent conversation context to classify the user's current primary intent.
   * This is used to route the request to the correct sub-agent.
   *
   * @param recentMessages A slice of the most recent messages (e.g., last 3-4) to provide context.
   */
  async classifyIntent(recentMessages: UIMessageLike[]): Promise<AgentIntent> {
    if (recentMessages.length === 0) {
      return 'GENERAL'
    }

    const log = getContextLogger()
    const openrouter = createOpenRouter({
      apiKey: envConfig.OPENROUTER_API_KEY
    })

    // Format recent messages for the router prompt
    const contextText = recentMessages
      .map((m) => {
        if (m.role === 'system') return null
        const textParts = m.parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join(' ')
        return `${m.role.toUpperCase()}: ${textParts}`
      })
      .filter(Boolean)
      .join('\n')

    const prompt = `You are a Semantic Router for a restaurant AI Assistant.
Analyze the following recent conversation snippet and classify the user's current PRIMARY intent.
ONLY evaluate the LAST user message, using the preceding messages purely for conversational context.

Conversation Snippet:
${contextText}

Classify the intent:`

    try {
      const result = await generateObject({
        model: openrouter.chat('google/gemini-2.5-flash'),
        schema: IntentSchema,
        prompt,
        maxOutputTokens: 2048
      })

      log?.info(
        `[AI Router] Classified Intent: ${result.object.intent} (Confidence: ${result.object.confidence}) - ${result.object.reasoning}`
      )

      return result.object.intent
    } catch (error) {
      log?.error({ err: error }, '[AI Router] Classification failed, defaulting to GENERAL intent.')
      return 'GENERAL'
    }
  }
}

export const aiRouterService = new AiRouterService()
