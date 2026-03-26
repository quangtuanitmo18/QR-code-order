import { validateMessageContent } from '@/middleware/ai-security'
import { adminAiRouterService } from '@/services/admin-ai-router.service'
import { createAdminAnalyticsAgentTools } from '@/services/agents/admin-analytics.agent'
import { createAdminMenuAgentTools } from '@/services/agents/admin-menu.agent'
import { createAdminOrdersAgentTools } from '@/services/agents/admin-orders.agent'
import { aiMemoryService } from '@/services/ai-memory.service'
import { streamTextWithFallback } from '@/services/ai-provider.service'
import { clearPendingExecution, getPendingExecution, savePendingExecution } from '@/services/pending-execution'
import { promptBuilderService } from '@/services/prompt-builder.service'
import { buildDAG, executeTasksV2 } from '@/services/task-executor'
import { enrichTasks } from '@/services/task-policy'
import { toUIMessages } from '@/utils/ai-message'
import { getContextLogger } from '@/utils/logger'
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, stepCountIs } from 'ai'
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

class AdminAiChatService {
  async handleChat(
    messages: Array<Record<string, unknown>>,
    accountId: number,
    sessionId: string | undefined,
    reply: FastifyReply,
    timeZone?: string
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

      // 2. Build admin-specific system prompt
      const systemPrompt = await promptBuilderService.buildAdminSystemPrompt(
        { summary: memorySummary },
        timeZone
      )

      // 3. Convert incoming messages to UIMessage format
      const newUiMessages = toUIMessages(
        messages as Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
      )

      // 3.5. Token budget check — refuse if session exceeded limit
      const sessionTokens = await aiMemoryService.getSessionTokens(session)
      if (sessionTokens >= SESSION_TOKEN_BUDGET) {
        log?.warn(`[Admin AI Chat] Session ${session} exceeded token budget (${sessionTokens}/${SESSION_TOKEN_BUDGET})`)
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
      const agentTools: any = {
        ...createAdminAnalyticsAgentTools({ accountId }),
        ...createAdminOrdersAgentTools({ accountId }),
        ...createAdminMenuAgentTools({ accountId })
      } // Always inject admin tools
      let isResumed = false

      if (pending) {
        // ─── V3: Resume DAG from blocked task ────────────────────────────
        log?.info(
          `[Admin AI Chat] Found pending execution for session ${session}, resuming blocked task ${pending.blockedTaskId}`
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
          { accountId, sessionId: session, messageTs: Date.now() },
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
      }

      // 3.8b. Plan Tasks (skip if resumed from pending)
      if (!isResumed) {
        const plan = await adminAiRouterService.planTasks(recentMessages)

        // 3.9. Determine single vs multi-intent path
        const isSingleIntent = plan.tasks.length <= 1

        if (isSingleIntent) {
          // ─── Fast Path: single intent → existing flow ────────────────────
          // In admin context, we always give all tools currently.
          log?.info(`[Admin AI Chat] Fast path executed.`)
        } else {
          // ─── V3: Confidence gate ─────────────────────────────────────────
          if (plan.confidence < LOW_CONFIDENCE && plan.isMultiIntent) {
            const preview = plan.tasks.map((t: any) => `• ${t.intent}(${JSON.stringify(t.params)})`).join('\n')
            multiIntentContext = `The user's request was analyzed but confidence is low (${plan.confidence.toFixed(2)}). Please confirm with the user if this decomposition is correct:\n\n${preview}\n\nAsk for confirmation.`
            log?.info(`[Admin AI Chat] Low confidence (${plan.confidence}), showing preview instead of executing`)
          } else {
            // ─── Multi-Intent Pipeline ───────────────────────────────────────
            multiIntentContext = await this.executeMultiIntentPipeline(plan, recentMessages, session, accountId, log)
          }
        }
      }

      // If multi-intent, inject execution results as additional system context
      const effectiveSystemPrompt = multiIntentContext
        ? `${systemPrompt}\n\n--- TASK EXECUTION RESULTS ---\nThe following tasks were executed based on the owner's request. Present the findings professionally. For blocked tasks demanding confirmation, ask securely.\n\n${multiIntentContext}`
        : systemPrompt

      log?.info(
        `[Admin AI Chat] Starting streamText (Session: ${session}, Hot History: ${hotMessages.length}, Tokens used: ${sessionTokens}, Resumed: ${isResumed})`
      )

      // 4. Stream text with tool calling + HITL wrapper
      const abortController = new AbortController()
      timeout = setTimeout(() => abortController.abort(), 30_000)

      const stream = createUIMessageStream({
        originalMessages: hotMessages,
        execute: async ({ writer }) => {
          const result = streamTextWithFallback(
            {
              maxOutputTokens: 2048,
              system: effectiveSystemPrompt,
              messages: await convertToModelMessages(hotMessages),
              tools: Object.keys(agentTools).length > 0 ? agentTools : undefined,
              stopWhen: stepCountIs(5),
              abortSignal: abortController.signal,
              onFinish: async (event: any) => {
                clearTimeout(timeout)
                try {
                  const newMessages = event.response.messages
                    .filter((msg: any) => msg.role === 'assistant')
                    .map((msg: any) => {
                      const textParts = ((msg.content || []) as any[])
                        .filter((c: any) => c.type === 'text' && c.text)
                        .map((c: any) => ({ type: 'text' as const, text: c.text }))
                      return {
                        id: `msg-asst-${Date.now()}-${Math.random()}`,
                        role: 'assistant' as const,
                        parts: textParts.length > 0 ? textParts : [{ type: 'text' as const, text: '' }]
                      }
                    })
                    .filter((msg: any) => msg.parts.some((p: any) => p.text !== ''))

                  const updatedHistory = [...hotMessages, ...newMessages]

                  if (needsNewSummary) {
                    log?.info(
                      `[Admin AI Memory] Generating progressive summary for ${evictedMessages.length} evicted messages`
                    )
                    memorySummary = await aiMemoryService.generateProgressiveSummary(memorySummary, evictedMessages)
                    summaryVersion++
                  }

                  await aiMemoryService.saveSession(
                    session,
                    updatedHistory,
                    { accountId },
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
                  log?.error({ err: e }, '[Admin AI Chat] Failed to save session on finish')
                }
              }
            },
            'openai/gpt-oss-120b',
            'google/gemini-2.5-flash'
          )

          writer.merge(result.toUIMessageStream({ originalMessages: hotMessages }))
        }
      })

      // 5. Pipe the stream directly to Fastify's raw response
      reply.hijack()

      const response = createUIMessageStreamResponse({ stream })
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
        log?.warn('[Admin AI Chat] Request timed out after 30s')
      } else {
        log?.error({ err: error }, '[Admin AI Chat] Error')
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

  // ─── V3: Multi-Intent Pipeline ──────────────────────────────────────────────

  private async executeMultiIntentPipeline(
    plan: any,
    recentMessages: any[],
    session: string,
    accountId: number | undefined,
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
      { accountId, sessionId: session, messageTs: Date.now() },
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
      '[Admin AI Chat] Multi-intent execution complete'
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
        'Blocked tasks (need admin input to proceed!):\n' +
          blockedResults.map((r) => `- ${r.intent}: ${r.reason}`).join('\n')
      )
    }
    if (failedResults.length > 0) {
      parts.push('Failed tasks:\n' + failedResults.map((r) => `- ${r.intent}: ${r.reason}`).join('\n'))
    }

    return parts.join('\n\n')
  }
}

export const adminAiChatService = new AdminAiChatService()
