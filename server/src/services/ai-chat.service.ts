import envConfig from '@/config'
import { validateMessageContent } from '@/middleware/ai-security'
import { createFaqAgentTools } from '@/services/agents/faq.agent'
import { createOrderAgentTools } from '@/services/agents/order.agent'
import { createSearchAgentTools } from '@/services/agents/search.agent'
import { aiMemoryService } from '@/services/ai-memory.service'
import { aiRouterService, intentFromTaskPlan } from '@/services/ai-router.service'
import { clearPendingExecution, getPendingExecution, savePendingExecution } from '@/services/pending-execution'
import { promptBuilderService } from '@/services/prompt-builder.service'
import { buildDAG, executeTasksV2 } from '@/services/task-executor'
import { enrichTasks } from '@/services/task-policy'
import { toUIMessages } from '@/utils/ai-message'
import { getContextLogger } from '@/utils/logger'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import crypto from 'crypto'
import { FastifyReply } from 'fastify'

/**
 * Filter out `providerMetadata` from SSE data lines.
 * @ai-sdk/react does not accept this field in tool-output-available events
 * but @openrouter/ai-sdk-provider injects it into every stream event.
 */
function filterSSEProviderMetadata(chunk: Uint8Array): Uint8Array {
  const text = new TextDecoder().decode(chunk)
  const filtered = text
    .split('\n')
    .map((line) => {
      if (!line.startsWith('data: ')) return line
      try {
        const data = JSON.parse(line.slice(6))
        if (data.providerMetadata !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { providerMetadata: _, ...rest } = data
          return 'data: ' + JSON.stringify(rest)
        }
      } catch {
        // Not valid JSON — leave line as-is
      }
      return line
    })
    .join('\n')
  return new TextEncoder().encode(filtered)
}

/** Max tokens a single session is allowed to consume before being cut off. */
const SESSION_TOKEN_BUDGET = 50_000

/** V3: Below this confidence, show decomposition preview instead of executing */
const LOW_CONFIDENCE = 0.5

class AiChatService {
  private openrouter = createOpenRouter({
    apiKey: envConfig.OPENROUTER_API_KEY
  })

  async handleChat(
    messages: Array<Record<string, unknown>>,
    userId: string,
    sessionId: string | undefined,
    reply: FastifyReply,
    guestId?: number
  ) {
    const log = getContextLogger()

    // 1. Security: validate message content + prompt injection check
    const flatMessages = messages.map((m) => ({
      role: String(m.role || 'user'),
      content:
        typeof m.content === 'string'
          ? m.content
          : Array.isArray(m.parts)
            ? (m.parts as Array<{ type: string; text?: string }>)
                .filter((p) => p.type === 'text')
                .map((p) => p.text || '')
                .join('')
            : ''
    }))

    const validation = validateMessageContent(flatMessages)
    if (!validation.valid) {
      reply.status(400).send({ error: validation.error })
      return
    }

    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      const session = sessionId || crypto.randomUUID()
      // Retrieve session history and progressive summary
      const memoryResult = await aiMemoryService.getSession(session)
      let memorySummary = memoryResult.summary
      let summaryVersion = memoryResult.summaryVersion

      // 2. Build dynamic system prompt from DB (restaurant info + FAQs) and inject memory summary
      const systemPrompt = await promptBuilderService.buildSystemPrompt(userId, { summary: memorySummary })

      // 3. Convert incoming messages to UIMessage format
      const newUiMessages = toUIMessages(
        messages as Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
      )

      // 3.5. Token budget check — refuse if session exceeded limit
      const sessionTokens = await aiMemoryService.getSessionTokens(session)
      if (sessionTokens >= SESSION_TOKEN_BUDGET) {
        log?.warn(`[AI Chat] Session ${session} exceeded token budget (${sessionTokens}/${SESSION_TOKEN_BUDGET})`)
        reply.status(429).send({
          error: `Chat session has exceeded the token limit (${SESSION_TOKEN_BUDGET.toLocaleString()}). Please start a new conversation.`
        })
        return
      }

      // Combine previous messages with new incoming messages
      const fullUiHistory = [...memoryResult.messages, ...newUiMessages]

      // Extract hot window (last N messages) and identify newly evicted messages
      const { hotMessages, evictedMessages } = aiMemoryService.buildContextWithSummary(fullUiHistory)
      const needsNewSummary = evictedMessages.length > 0

      // 3.8. V3: Check for pending multi-turn resume BEFORE planning
      const recentMessages = hotMessages.slice(-4)
      const pending = getPendingExecution(session)
      let multiIntentContext = ''
      let agentTools: any = {}
      let isResumed = false

      if (pending) {
        // ─── V3: Resume DAG from blocked task ────────────────────────────
        log?.info(
          `[AI Chat] Found pending execution for session ${session}, resuming blocked task ${pending.blockedTaskId}`
        )

        const lastUserMsg = recentMessages.filter((m) => m.role === 'user').pop()
        const userReply =
          lastUserMsg?.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join(' ') || ''

        // Inject user reply as resolved params for blocked task
        const resumedTasks = pending.enrichedTasks.map((task) => {
          if (task.id === pending.blockedTaskId) {
            return { ...task, params: { ...task.params, __userReply: userReply, confirmed: true } }
          }
          return task
        })

        // Re-execute only non-completed tasks
        const trace = await executeTasksV2(
          resumedTasks.filter((t) => !pending.completedTaskIds.has(t.id)),
          pending.dag,
          { guestId, sessionId: session, messageTs: Date.now() },
          pending.originalMessage,
          pending.suggestedDeps
        )

        clearPendingExecution(session)
        isResumed = true

        // Merge prior completed results with resumed results
        const completedResults = trace.results.filter((r) => r.status === 'completed' && r.data)
        const blockedResults = trace.results.filter((r) => r.status === 'blocked')
        const failedResults = trace.results.filter((r) => r.status === 'failed')

        const parts: string[] = ['(Resumed from previous multi-turn interaction)']
        if (completedResults.length > 0) {
          parts.push(
            'Completed task results:\n' +
              JSON.stringify(
                completedResults.map((r) => ({ task: r.intent, data: r.data })),
                null,
                2
              )
          )
        }
        if (blockedResults.length > 0) {
          parts.push(
            'Blocked tasks (need user input):\n' + blockedResults.map((r) => `- ${r.intent}: ${r.reason}`).join('\n')
          )
          // Re-save if still blocked
          savePendingExecution(session, {
            ...pending,
            blockedTaskId: blockedResults[0].taskId,
            blockedReason: blockedResults[0].reason || 'unknown'
          })
        }
        if (failedResults.length > 0) {
          parts.push('Failed tasks:\n' + failedResults.map((r) => `- ${r.intent}: ${r.reason}`).join('\n'))
        }
        multiIntentContext = parts.join('\n\n')

        // Give AI all tools after resume so it can handle follow-up actions
        agentTools = {
          ...createSearchAgentTools(),
          ...createOrderAgentTools({ guestId }),
          ...createFaqAgentTools()
        }
      }

      // 3.8b. Plan Tasks (skip if resumed from pending)
      if (!isResumed) {
        const plan = await aiRouterService.planTasks(recentMessages)

        // 3.9. Determine single vs multi-intent path
        const isSingleIntent = plan.tasks.length <= 1

        if (isSingleIntent) {
          // ─── Fast Path: single intent → existing flow ────────────────────
          const intent = intentFromTaskPlan(plan.tasks[0])
          if (intent === 'SEARCH') {
            agentTools = createSearchAgentTools()
          } else if (intent === 'ORDER') {
            agentTools = createOrderAgentTools({ guestId })
          } else if (intent === 'FAQ') {
            agentTools = createFaqAgentTools()
          } else {
            // GENERAL or unknown: give ALL tools so AI can decide what's needed
            // This prevents the case where planner misclassifies a search query
            // as general_chat → AI gets no tools → can't actually search
            agentTools = {
              ...createSearchAgentTools(),
              ...createOrderAgentTools({ guestId }),
              ...createFaqAgentTools()
            }
          }
          log?.info(`[AI Chat] Fast path: single intent ${intent}`)
        } else {
          // ─── V3: Confidence gate ─────────────────────────────────────────
          if (plan.confidence < LOW_CONFIDENCE && plan.isMultiIntent) {
            const preview = plan.tasks.map((t: any) => `• ${t.intent}(${JSON.stringify(t.params)})`).join('\n')
            multiIntentContext = `The user's request was analyzed but confidence is low (${plan.confidence.toFixed(2)}). Please confirm with the user if this decomposition is correct:\n\n${preview}\n\nAsk: "Mình hiểu bạn muốn: ... Đúng không?"`
            log?.info(`[AI Chat] Low confidence (${plan.confidence}), showing preview instead of executing`)
          } else {
            // ─── Multi-Intent Pipeline ───────────────────────────────────────
            multiIntentContext = await this.executeMultiIntentPipeline(plan, recentMessages, session, guestId, log)
          }
        }
      }

      const modelMessages = await convertToModelMessages(hotMessages)

      // If multi-intent, inject execution results as additional system context
      const effectiveSystemPrompt = multiIntentContext
        ? `${systemPrompt}\n\n--- TASK EXECUTION RESULTS ---\nThe following tasks were executed based on the user's multi-part request. Use these results to compose your response. Present each result clearly. For blocked tasks, ask the user for clarification.\n\n${multiIntentContext}`
        : systemPrompt

      log?.info(
        `[AI Chat] Starting streamText (Session: ${session}, Hot History: ${hotMessages.length}, Tokens used: ${sessionTokens}, Resumed: ${isResumed})`
      )

      // 4. Stream text with tool calling + 30s timeout
      const abortController = new AbortController()
      timeout = setTimeout(() => abortController.abort(), 30_000)

      const result = streamText({
        model: this.openrouter.chat('google/gemini-2.5-flash'),
        maxOutputTokens: 2048,
        system: effectiveSystemPrompt,
        messages: modelMessages,
        tools: Object.keys(agentTools).length > 0 ? agentTools : undefined,
        stopWhen: stepCountIs(8),

        abortSignal: abortController.signal,
        onFinish: async (event) => {
          clearTimeout(timeout)
          try {
            const newMessages = event.response.messages
              .filter((msg) => msg.role === 'assistant')
              .map((msg) => {
                const textParts = ((msg.content || []) as any[])
                  .filter((c: any) => c.type === 'text' && c.text)
                  .map((c: any) => ({ type: 'text' as const, text: c.text }))
                return {
                  id: `msg-asst-${Date.now()}-${Math.random()}`,
                  role: 'assistant' as const,
                  parts: textParts.length > 0 ? textParts : [{ type: 'text' as const, text: '' }]
                }
              })
              .filter((msg) => msg.parts.some((p) => p.text !== ''))

            const updatedHistory = [...hotMessages, ...newMessages]

            if (needsNewSummary) {
              log?.info(`[AI Memory] Generating progressive summary for ${evictedMessages.length} evicted messages`)
              memorySummary = await aiMemoryService.generateProgressiveSummary(memorySummary, evictedMessages)
              summaryVersion++
            }

            const parsedUserId = userId !== 'guest' ? parseInt(userId) : undefined
            await aiMemoryService.saveSession(
              session,
              updatedHistory,
              { accountId: parsedUserId, guestId },
              event.usage
                ? {
                    promptTokens: event.usage.inputTokens || 0,
                    completionTokens: event.usage.outputTokens || 0,
                    totalTokens: event.usage.totalTokens || 0
                  }
                : undefined,
              memorySummary,
              summaryVersion
            )
          } catch (e) {
            log?.error({ err: e }, '[AI Chat] Failed to save session on finish')
          }
        }
      })

      // 5. Pipe the stream directly to Fastify's raw response
      reply.hijack()

      const response = result.toUIMessageStreamResponse()
      const headers: Record<string, string> = {
        'x-ai-session-id': session
      }
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      reply.raw.writeHead(response.status || 200, headers)

      if (response.body) {
        const reader = response.body.getReader()
        const pump = async () => {
          let done = false
          while (!done) {
            const readResult = await reader.read()
            done = readResult.done
            if (done) {
              reply.raw.end()
            } else if (readResult.value) {
              reply.raw.write(filterSSEProviderMetadata(readResult.value))
            }
          }
        }
        await pump()
      } else {
        reply.raw.end()
      }
    } catch (error: unknown) {
      clearTimeout(timeout)
      const isAbort = error instanceof Error && error.name === 'AbortError'
      if (isAbort) {
        log?.warn('[AI Chat] Request timed out after 30s')
      } else {
        log?.error({ err: error }, '[AI Chat] Error')
      }

      if (!reply.raw.headersSent) {
        reply.status(isAbort ? 504 : 500).send({
          error: isAbort ? 'AI is currently overloaded, please try again shortly.' : 'Failed to process AI chat request'
        })
      } else {
        reply.raw.end()
      }
    }
  }

  // ─── V3: Multi-Intent Pipeline (extracted for resume reuse) ─────────────────

  private async executeMultiIntentPipeline(
    plan: any,
    recentMessages: any[],
    session: string,
    guestId: number | undefined,
    log: ReturnType<typeof getContextLogger>
  ): Promise<string> {
    const enrichedTasks = enrichTasks(plan.tasks)

    const lastUserMsg = recentMessages.filter((m) => m.role === 'user').pop()
    const originalMessage =
      lastUserMsg?.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join(' ') || ''

    const dag = buildDAG(enrichedTasks, plan.suggestedDependencies)

    const trace = await executeTasksV2(
      enrichedTasks,
      dag,
      { guestId, sessionId: session, messageTs: Date.now() },
      originalMessage,
      plan.suggestedDependencies
    )

    log?.info(
      {
        taskCount: trace.detectedTasks.length,
        completed: trace.results.filter((r) => r.status === 'completed').length,
        blocked: trace.results.filter((r) => r.status === 'blocked').length,
        totalLatencyMs: trace.totalLatencyMs
      },
      '[AI Chat] Multi-intent execution complete'
    )

    // Save pending if blocked
    const blockedResults = trace.results.filter((r) => r.status === 'blocked')
    if (blockedResults.length > 0) {
      savePendingExecution(session, {
        sessionId: session,
        dag,
        stateCtx: { taskResults: new Map(trace.results.filter((r) => r.data).map((r) => [r.taskId, r.data])) },
        blockedTaskId: blockedResults[0].taskId,
        blockedReason: blockedResults[0].reason || 'unknown',
        completedTaskIds: new Set(trace.results.filter((r) => r.status === 'completed').map((r) => r.taskId)),
        enrichedTasks,
        suggestedDeps: plan.suggestedDependencies || [],
        originalMessage
      })
    }

    const completedResults = trace.results.filter((r) => r.status === 'completed' && r.data)
    const failedResults = trace.results.filter((r) => r.status === 'failed')
    const parts: string[] = []

    if (completedResults.length > 0) {
      parts.push(
        'Completed task results:\n' +
          JSON.stringify(
            completedResults.map((r) => ({ task: r.intent, data: r.data })),
            null,
            2
          )
      )
    }
    if (blockedResults.length > 0) {
      parts.push(
        'Blocked tasks (need user input):\n' + blockedResults.map((r) => `- ${r.intent}: ${r.reason}`).join('\n')
      )
    }
    if (failedResults.length > 0) {
      parts.push('Failed tasks:\n' + failedResults.map((r) => `- ${r.intent}: ${r.reason}`).join('\n'))
    }

    return parts.join('\n\n')
  }
}

export const aiChatService = new AiChatService()
