import { generateObjectWithFallback } from '@/services/ai-provider.service'
import { getContextLogger } from '@/utils/logger'
import { z } from 'zod'
import { UIMessageLike } from './ai-memory.service'
import { type RawTask } from './task-policy'

// ─── Schemas ─────────────────────────────────────────────────────────────────

/** Legacy single-intent schema (kept for fast-path) */
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

/** Multi-intent task plan schema — LLM only outputs intent + params */
export const TaskPlanSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string().describe('Unique task ID like "t1", "t2"'),
        intent: z
          .enum([
            'search_product',
            'search_faq',
            'place_order',
            'cancel_order',
            'apply_coupon',
            'get_order_status',
            'get_restaurant_info',
            'get_available_coupons',
            'general_chat'
          ])
          .describe('The atomic intent of this sub-task'),
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

export type TaskPlanResult = z.infer<typeof TaskPlanSchema>

// ─── Intent → Legacy mapping (for fast-path) ────────────────────────────────

const INTENT_MAP: Record<string, AgentIntent> = {
  search_product: 'SEARCH',
  search_faq: 'FAQ',
  get_restaurant_info: 'FAQ',
  get_order_status: 'ORDER',
  get_available_coupons: 'ORDER',
  place_order: 'ORDER',
  cancel_order: 'ORDER',
  apply_coupon: 'ORDER',
  general_chat: 'GENERAL'
}

export function intentFromTaskPlan(task: RawTask): AgentIntent {
  return INTENT_MAP[task.intent] || 'GENERAL'
}

// ─── Planner ─────────────────────────────────────────────────────────────────

class AiRouterService {
  /**
   * Plan tasks from user message. Returns a structured task list.
   *
   * - If single task with high confidence → fast-path (returns 1 task)
   * - If multi-task → returns all tasks for orchestration
   * - If low confidence → returns single task (degrade gracefully)
   */
  async planTasks(recentMessages: UIMessageLike[]): Promise<TaskPlanResult> {
    if (recentMessages.length === 0) {
      return {
        tasks: [{ id: 't1', intent: 'general_chat', params: {} }],
        isMultiIntent: false,
        confidence: 1.0
      }
    }

    const log = getContextLogger()

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

    const prompt = `You are a Task Planner for a restaurant AI assistant.
Analyze the user's LAST message and decompose it into atomic tasks.

Available intents:
- search_product: Search menu items (params: { query: string })
- search_faq: Search FAQ about restaurant (params: { query: string })
- get_restaurant_info: Get restaurant settings/hours (params: {})
- get_order_status: Check order status (params: {})
- get_available_coupons: List available coupons (params: {})
- place_order: Order dishes (params: { items: [{ dishName: string, quantity: number }] })
- cancel_order: Cancel an order (params: { orderId: number })
- apply_coupon: Apply coupon to order (params: { couponCode: string, orderId: number })
- general_chat: General conversation (params: { message: string })

Rules:
1. Most messages have ONE intent. Only split into multiple if the user explicitly asks for multiple different things.
2. "tìm sữa hạt và dầu dừa" = ONE search_product task (multi-entity, not multi-intent)
3. "tìm sữa hạt rồi thêm dầu dừa vào giỏ" = TWO tasks (search + place_order)
4. Output structured JSON only. No reasoning text.
5. suggestedDependencies: if task B needs output from task A, specify it.
6. Max 4 tasks.

Conversation:
${contextText}

Decompose the user's last message into tasks:`

    try {
      const result = await generateObjectWithFallback(
        {
          schema: TaskPlanSchema,
          prompt,
          maxOutputTokens: 2048
        },
        'gemini-3.1-flash-lite',
        'gemini-3.1-flash-lite'
      )

      const plan = result.object as TaskPlanResult

      log?.info(
        `[AI Planner] Planned ${plan.tasks.length} task(s): [${plan.tasks.map((t) => t.intent).join(', ')}] (confidence: ${plan.confidence})`
      )

      return plan
    } catch (error) {
      log?.error({ err: error }, '[AI Planner] Planning failed, defaulting to general_chat')
      return {
        tasks: [{ id: 't1', intent: 'general_chat', params: {} }],
        isMultiIntent: false,
        confidence: 0.5
      }
    }
  }
}

export const aiRouterService = new AiRouterService()
