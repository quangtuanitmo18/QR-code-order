import envConfig from '@/config'
import { getContextLogger } from '@/utils/logger'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject } from 'ai'
import { z } from 'zod'
import { UIMessageLike } from './ai-memory.service'

// ─── Schemas ─────────────────────────────────────────────────────────────────

/** Multi-intent task plan schema for Admin */
export const AdminTaskPlanSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string().describe('Unique task ID like "t1", "t2"'),
        intent: z
          .enum([
            'admin_get_revenue_trends',
            'admin_get_dish_performance',
            'admin_search_orders',
            'admin_update_dish',
            'admin_cancel_order',
            'admin_get_live_orders',
            'general_chat'
          ])
          .describe('The atomic intent of this Admin sub-task'),
        params: z.record(z.unknown()).describe('Parameters for this task')
      })
    )
    .min(1)
    .max(4),
  isMultiIntent: z.boolean().describe('True if the message contains multiple distinct intents'),
  confidence: z.number().min(0).max(1).describe('Overall confidence in the decomposition'),
  suggestedDependencies: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        reason: z.string()
      })
    )
    .optional()
    .describe('Optional: suggest if any task depends on another')
})

export type AdminTaskPlanResult = z.infer<typeof AdminTaskPlanSchema>

// ─── Planner ─────────────────────────────────────────────────────────────────

class AdminAiRouterService {
  /**
   * Plan admin tasks from owner message. Returns a structured task list.
   */
  async planTasks(recentMessages: UIMessageLike[]): Promise<AdminTaskPlanResult> {
    if (recentMessages.length === 0) {
      return {
        tasks: [{ id: 't1', intent: 'general_chat', params: {} }],
        isMultiIntent: false,
        confidence: 1.0
      }
    }

    const log = getContextLogger()
    const openrouter = createOpenRouter({
      apiKey: envConfig.OPENROUTER_API_KEY
    })

    // Format recent messages for the planner prompt
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

    const prompt = `You are the Admin Task Planner for a restaurant AI assistant.
Analyze the Owner's LAST message and decompose it into atomic admin tasks.

Available intents:
- admin_get_revenue_trends: Check revenue/sales performance over time (params: { startDate: string, endDate: string })
- admin_get_dish_performance: Best or worst selling dishes (params: { sortBy: 'best' | 'worst', limit: number })
- admin_search_orders: Search historical orders by table, date, guest name, or status (params: { tableNumber?: number, startDate?: string, endDate?: string, guestName?: string, status?: string, limit?: number })
- admin_update_dish: Update status (Available/Unavailable/Hidden) or change price (params: { dishId: number, updates: { status?: string, price?: number } })
- admin_cancel_order: Force cancel an order (params: { orderId: number, reason: string })
- admin_get_live_orders: Live restaurant / table overview (params: {})
- general_chat: General queries or chit-chat that doesn't fit the operations (params: { message: string })

Rules:
1. Decompose complex requests into sequential steps if needed.
2. If changing price of multiple dishes, use multiple admin_update_dish tasks.
3. Output structured JSON only. No reasoning text.
4. suggestedDependencies: if task B needs output from task A, specify it.
5. Max 4 tasks.

Conversation:
${contextText}

Decompose the owner's last message into tasks:`

    try {
      const result = await generateObject({
        model: openrouter.chat('google/gemini-2.5-flash'),
        schema: AdminTaskPlanSchema,
        prompt,
        maxOutputTokens: 2048
      })

      const plan = result.object

      log?.info(
        `[Admin AI Planner] Planned ${plan.tasks.length} task(s): [${plan.tasks.map((t) => t.intent).join(', ')}] (confidence: ${plan.confidence})`
      )

      return plan
    } catch (error) {
      log?.error({ err: error }, '[Admin AI Planner] Planning failed, defaulting to general_chat')
      return {
        tasks: [{ id: 't1', intent: 'general_chat', params: {} }],
        isMultiIntent: false,
        confidence: 0.5
      }
    }
  }
}

export const adminAiRouterService = new AdminAiRouterService()
