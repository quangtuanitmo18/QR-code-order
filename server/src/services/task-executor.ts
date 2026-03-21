import prisma from '@/database'
import { adminService } from '@/services/admin.service'
import { createAdminAnalyticsAgentTools } from '@/services/agents/admin-analytics.agent'
import { createAdminOrdersAgentTools } from '@/services/agents/admin-orders.agent'
import { createFaqAgentTools } from '@/services/agents/faq.agent'
import { createOrderAgentTools } from '@/services/agents/order.agent'
import { createSearchAgentTools } from '@/services/agents/search.agent'
import { couponService } from '@/services/coupon.service'
import { guestService } from '@/services/guest.service'
import {
  cacheMutationResult,
  canExecuteMutationV2,
  checkDuplicate,
  getIdempotencyKey,
  shouldRunParallel,
  type DAGNode,
  type EnrichedTask,
  type ExecutionStage,
  type GateResult,
  type StateContext
} from '@/services/task-policy'
import { getContextLogger } from '@/utils/logger'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskResult {
  taskId: string
  intent: string
  status: 'completed' | 'blocked' | 'failed' | 'deduplicated'
  data?: unknown
  reason?: string
  latencyMs: number
}

export interface ExecutorContext {
  guestId?: number
  accountId?: number
  sessionId: string
  messageTs: number
}

export interface ExecutionTrace {
  originalMessage: string
  detectedTasks: EnrichedTask[]
  executionPlan: ExecutionStage[] // V1 compat
  dag?: Map<string, DAGNode> // V2
  results: TaskResult[]
  totalLatencyMs: number
}

// ─── Tool Registry ───────────────────────────────────────────────────────────

function getToolExecutor(
  intent: string,
  context: ExecutorContext
): ((params: Record<string, unknown>) => Promise<unknown>) | null {
  switch (intent) {
    case 'search_product': {
      const tools = createSearchAgentTools()
      return async (params) =>
        (tools.searchMenuSemantic.execute as any)({ query: String(params.query || '') }, { abortSignal: undefined })
    }
    case 'search_faq': {
      const tools = createFaqAgentTools()
      return async (params) =>
        (tools.searchFAQ.execute as any)({ query: String(params.query || '') }, { abortSignal: undefined })
    }
    case 'get_restaurant_info': {
      const tools = createFaqAgentTools()
      return async () => (tools.getRestaurantInfo.execute as any)({}, { abortSignal: undefined })
    }
    case 'get_order_status': {
      const tools = createOrderAgentTools({ guestId: context.guestId })
      return async () => (tools.getOrderStatus.execute as any)({}, { abortSignal: undefined })
    }
    case 'get_available_coupons': {
      const tools = createOrderAgentTools({ guestId: context.guestId })
      return async () => (tools.getAvailableCoupons.execute as any)({}, { abortSignal: undefined })
    }
    case 'place_order': {
      return async (params) => {
        const items = params.items as Array<{ dishName: string; quantity: number }> | undefined
        if (!items || items.length === 0) return { message: 'No items specified for the order.' }
        if (!context.guestId) return { message: 'Unable to identify your session.' }
        return guestService.placeOrderByName(context.guestId, items)
      }
    }
    case 'cancel_order': {
      return async (params) => {
        const orderId = Number(params.orderId)
        if (!orderId) return { message: 'Please specify which order to cancel.' }
        if (!context.guestId) return { message: 'Unable to identify your session.' }
        const result = await guestService.cancelOrder(orderId, context.guestId)
        return { message: `Order #${orderId} has been cancelled successfully.`, ...result }
      }
    }
    case 'apply_coupon': {
      return async (params) => {
        const couponCode = String(params.couponCode || '')
        const orderId = Number(params.orderId)
        if (!couponCode || !orderId) return { message: 'Please specify the coupon code and order ID.' }
        if (!context.guestId) return { message: 'Unable to identify your session.' }
        const result = await couponService.applyToOrder(couponCode, orderId, context.guestId)
        return { message: `Coupon "${couponCode}" applied successfully! 🎉`, ...result }
      }
    }
    case 'general_chat':
      return async () => null
    // ─── Admin Tools ─────────────────────────────────────────────────────
    case 'admin_get_revenue_trends': {
      const tools = createAdminAnalyticsAgentTools({ accountId: context.accountId })
      return async (params) => (tools.admin_get_revenue_trends.execute as any)(params, { abortSignal: undefined })
    }
    case 'admin_get_dish_performance': {
      const tools = createAdminAnalyticsAgentTools({ accountId: context.accountId })
      return async (params) => (tools.admin_get_dish_performance.execute as any)(params, { abortSignal: undefined })
    }
    case 'admin_update_dish': {
      return async (params) => {
        return adminService.updateDish(Number(params.dishId), params.updates as any)
      }
    }
    case 'admin_cancel_order': {
      return async (params) => {
        return adminService.cancelOrder(Number(params.orderId), String(params.reason || 'Admin action'))
      }
    }
    case 'admin_get_live_orders': {
      const tools = createAdminOrdersAgentTools({ accountId: context.accountId })
      return async () => (tools.admin_get_live_orders.execute as any)({}, { abortSignal: undefined })
    }
    default:
      return null
  }
}

// ─── V2: DAG Builder ─────────────────────────────────────────────────────────

/**
 * Build a directed acyclic graph from enriched tasks + suggested dependencies.
 * Adds implicit deps: reads before writes on same resource.
 */
export function buildDAG(tasks: EnrichedTask[], suggestedDeps?: { from: string; to: string }[]): Map<string, DAGNode> {
  const dag = new Map<string, DAGNode>()

  // Initialize all nodes
  for (const task of tasks) {
    dag.set(task.id, {
      task,
      dependsOn: new Set(),
      dependedBy: new Set()
    })
  }

  // Add explicit dependencies from planner
  if (suggestedDeps) {
    for (const dep of suggestedDeps) {
      const fromNode = dag.get(dep.from)
      const toNode = dag.get(dep.to)
      if (fromNode && toNode) {
        toNode.dependsOn.add(dep.from)
        fromNode.dependedBy.add(dep.to)
      }
    }
  }

  // Add implicit deps: writes depend on reads that operate on same resource
  // (if not already covered by explicit deps)
  const reads = tasks.filter((t) => t.actionType === 'read')
  const writes = tasks.filter((t) => t.actionType === 'write' || t.actionType === 'transaction')

  for (const write of writes) {
    for (const read of reads) {
      if (read.resource === write.resource) {
        const writeNode = dag.get(write.id)!
        const readNode = dag.get(read.id)!
        if (!writeNode.dependsOn.has(read.id)) {
          writeNode.dependsOn.add(read.id)
          readNode.dependedBy.add(write.id)
        }
      }
    }
  }

  return dag
}

// ─── V3: Retry with Backoff ──────────────────────────────────────────────────

const RETRYABLE_PATTERNS = ['ETIMEOUT', 'ECONNRESET', 'ENOTFOUND', '5', 'fetch failed', 'network']

async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 1, delayMs = 500): Promise<T> {
  const log = getContextLogger()
  try {
    return await fn()
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const isRetryable = RETRYABLE_PATTERNS.some((pat) => msg.includes(pat))
    if (isRetryable && maxRetries > 0) {
      log?.info(`[Retry] Retrying after ${delayMs}ms (${maxRetries} left): ${msg}`)
      await new Promise((r) => setTimeout(r, delayMs))
      return executeWithRetry(fn, maxRetries - 1, delayMs)
    }
    throw error
  }
}

// ─── V2: State Forwarding ────────────────────────────────────────────────────

/**
 * Inject prior task results into a dependent task's params.
 * V2: present-and-ask.
 * V3: auto-pick if exactly 1 search result.
 */
export function injectDependencyResults(
  task: EnrichedTask,
  deps: { from: string; to: string }[],
  stateCtx: StateContext
): EnrichedTask {
  const myDeps = deps.filter((d) => d.to === task.id)
  if (myDeps.length === 0) return task

  const priorResults = myDeps
    .map((d) => ({ taskId: d.from, data: stateCtx.taskResults.get(d.from) }))
    .filter((d) => d.data !== undefined)

  if (priorResults.length === 0) return task

  // V3: Auto-pick if exactly 1 search result from prior read
  let autoPickedResult: unknown = undefined
  if (priorResults.length === 1 && task.actionType !== 'read') {
    const searchData = priorResults[0].data
    if (Array.isArray(searchData) && searchData.length === 1) {
      autoPickedResult = searchData[0]
    }
  }

  return {
    ...task,
    params: {
      ...task.params,
      __priorResults: priorResults,
      ...(autoPickedResult !== undefined ? { __autoPickedResult: autoPickedResult } : {})
    }
  }
}

// ─── V2: Cycle Detection ─────────────────────────────────────────────────────

function hasCycle(dag: Map<string, DAGNode>): boolean {
  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    inStack.add(nodeId)

    const node = dag.get(nodeId)
    if (node) {
      for (const depBy of node.dependedBy) {
        if (!visited.has(depBy)) {
          if (dfs(depBy)) return true
        } else if (inStack.has(depBy)) {
          return true // cycle detected
        }
      }
    }

    inStack.delete(nodeId)
    return false
  }

  for (const nodeId of dag.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true
    }
  }
  return false
}

// ─── V2: DAG Executor ────────────────────────────────────────────────────────

/**
 * Execute tasks according to DAG dependencies via topological ordering.
 * Tasks run as soon as their dependencies complete (not waiting for whole stage).
 * Ready tasks with no conflicts are grouped by parallel-safety.
 */
export async function executeTasksV2(
  tasks: EnrichedTask[],
  dag: Map<string, DAGNode>,
  context: ExecutorContext,
  originalMessage: string,
  suggestedDeps?: { from: string; to: string }[],
  onTaskProgress?: (event: {
    taskId: string
    intent: string
    status: string
    timestamp: number
    data?: unknown
  }) => void
): Promise<ExecutionTrace> {
  const log = getContextLogger()
  const startTime = Date.now()
  const results: TaskResult[] = []
  const completed = new Set<string>()
  const stateCtx: StateContext = { taskResults: new Map() }

  // Cycle check → fallback to sequential if cyclic
  if (hasCycle(dag)) {
    log?.warn('[DAG Executor] Cycle detected in DAG, falling back to sequential execution')
    for (const [, node] of dag) {
      onTaskProgress?.({ taskId: node.task.id, intent: node.task.intent, status: 'running', timestamp: Date.now() })
      const result = await executeOneTask(node.task, context, stateCtx, suggestedDeps)
      results.push(result)
      onTaskProgress?.({
        taskId: node.task.id,
        intent: node.task.intent,
        status: result.status,
        timestamp: Date.now(),
        data: result.data
      })
      if (result.status === 'completed') {
        stateCtx.taskResults.set(node.task.id, result.data)
      }
      completed.add(node.task.id)
    }
  } else {
    // Topological execution
    let maxIterations = tasks.length + 1 // safety limit
    while (completed.size < dag.size && maxIterations-- > 0) {
      // Find all tasks whose dependencies are ALL completed
      const ready: DAGNode[] = []
      for (const [, node] of dag) {
        if (completed.has(node.task.id)) continue
        const allDepsComplete = [...node.dependsOn].every((depId) => completed.has(depId))
        if (allDepsComplete) {
          ready.push(node)
        }
      }

      if (ready.length === 0) {
        // Shouldn't happen after cycle check, but safety
        log?.warn('[DAG Executor] No ready tasks but not all complete — aborting')
        break
      }

      // Group ready tasks by parallel-safety
      const groups = groupByParallelSafety(ready)

      for (const group of groups) {
        if (group.length > 1) {
          // Parallel execution
          const promises = group.map((node) => {
            onTaskProgress?.({
              taskId: node.task.id,
              intent: node.task.intent,
              status: 'running',
              timestamp: Date.now()
            })
            return executeOneTask(node.task, context, stateCtx, suggestedDeps)
          })
          const settled = await Promise.allSettled(promises)

          for (let i = 0; i < settled.length; i++) {
            const result = settled[i]
            if (result.status === 'fulfilled') {
              results.push(result.value)
              onTaskProgress?.({
                taskId: group[i].task.id,
                intent: group[i].task.intent,
                status: result.value.status,
                timestamp: Date.now(),
                data: result.value.data
              })
              if (result.value.status === 'completed') {
                stateCtx.taskResults.set(group[i].task.id, result.value.data)
              }
            } else {
              const failResult: TaskResult = {
                taskId: group[i].task.id,
                intent: group[i].task.intent,
                status: 'failed',
                reason: result.reason?.message || 'Unknown error',
                latencyMs: 0
              }
              results.push(failResult)
              onTaskProgress?.({
                taskId: group[i].task.id,
                intent: group[i].task.intent,
                status: 'failed',
                timestamp: Date.now()
              })
            }
            completed.add(group[i].task.id)
          }
        } else {
          // Sequential
          const node = group[0]
          try {
            onTaskProgress?.({
              taskId: node.task.id,
              intent: node.task.intent,
              status: 'running',
              timestamp: Date.now()
            })
            const result = await executeOneTask(node.task, context, stateCtx, suggestedDeps)
            results.push(result)
            onTaskProgress?.({
              taskId: node.task.id,
              intent: node.task.intent,
              status: result.status,
              timestamp: Date.now(),
              data: result.data
            })
            if (result.status === 'completed') {
              stateCtx.taskResults.set(node.task.id, result.data)
            }
          } catch (error) {
            const failResult: TaskResult = {
              taskId: node.task.id,
              intent: node.task.intent,
              status: 'failed',
              reason: error instanceof Error ? error.message : 'Unknown error',
              latencyMs: 0
            }
            results.push(failResult)
            onTaskProgress?.({
              taskId: node.task.id,
              intent: node.task.intent,
              status: 'failed',
              timestamp: Date.now()
            })
          }
          completed.add(node.task.id)
        }
      }
    }
  }

  const trace: ExecutionTrace = {
    originalMessage,
    detectedTasks: tasks,
    executionPlan: [], // V2 uses DAG not flat stages
    dag,
    results,
    totalLatencyMs: Date.now() - startTime
  }

  log?.info(
    {
      taskCount: tasks.length,
      completed: results.filter((r) => r.status === 'completed').length,
      blocked: results.filter((r) => r.status === 'blocked').length,
      failed: results.filter((r) => r.status === 'failed').length,
      deduplicated: results.filter((r) => r.status === 'deduplicated').length,
      totalLatencyMs: trace.totalLatencyMs
    },
    '[DAG Executor] Execution complete'
  )

  // V2: Fire-and-forget trace persistence — don't block response
  persistTrace(trace, context.sessionId).catch((err) => log?.warn({ err }, '[Trace] Failed to persist execution trace'))

  return trace
}

// ─── V2: Trace Persistence ───────────────────────────────────────────────────

/**
 * Persist execution trace to DB for analytics. Non-blocking.
 */
async function persistTrace(trace: ExecutionTrace, sessionId: string): Promise<void> {
  const completedCount = trace.results.filter((r) => r.status === 'completed').length
  const blockedCount = trace.results.filter((r) => r.status === 'blocked').length
  const failedCount = trace.results.filter((r) => r.status === 'failed').length

  // Serialize trace data (strip non-serializable fields like Map/Set)
  const serializableTrace = {
    originalMessage: trace.originalMessage,
    detectedTasks: trace.detectedTasks,
    results: trace.results,
    totalLatencyMs: trace.totalLatencyMs
  }

  await prisma.executionTrace.create({
    data: {
      sessionId,
      originalMessage: trace.originalMessage,
      taskCount: trace.detectedTasks.length,
      completedCount,
      blockedCount,
      failedCount,
      totalLatencyMs: trace.totalLatencyMs,
      traceData: JSON.stringify(serializableTrace)
    }
  })
}

/**
 * Group ready DAGNodes into parallel-safe groups.
 * Uses hybrid check: whitelist fast-path + resource-based auto-detect.
 */
function groupByParallelSafety(ready: DAGNode[]): DAGNode[][] {
  if (ready.length <= 1) return [ready]

  // Try to find the largest group where ALL pairs are parallel-safe
  const parallelGroup: DAGNode[] = [ready[0]]
  const sequential: DAGNode[] = []

  for (let i = 1; i < ready.length; i++) {
    const canAdd = parallelGroup.every((existing) => shouldRunParallel(existing.task, ready[i].task))
    if (canAdd) {
      parallelGroup.push(ready[i])
    } else {
      sequential.push(ready[i])
    }
  }

  const groups: DAGNode[][] = []
  if (parallelGroup.length > 1) {
    groups.push(parallelGroup)
  } else {
    // Single item → sequential
    groups.push([parallelGroup[0]])
  }

  // Remaining sequential tasks: each as its own group
  for (const node of sequential) {
    groups.push([node])
  }

  return groups
}

// V1 executeTasks removed — no longer used. Use executeTasksV2 with DAG instead.

// ─── Execute a single task ───────────────────────────────────────────────────

async function executeOneTask(
  task: EnrichedTask,
  context: ExecutorContext,
  stateCtx?: StateContext,
  suggestedDeps?: { from: string; to: string }[]
): Promise<TaskResult> {
  const log = getContextLogger()
  const taskStart = Date.now()

  // Skip general_chat — handled by LLM directly
  if (task.intent === 'general_chat') {
    return {
      taskId: task.id,
      intent: task.intent,
      status: 'completed',
      data: null,
      latencyMs: 0
    }
  }

  // V2: inject prior results from dependencies (state forwarding)
  let enrichedTask = task
  if (stateCtx && suggestedDeps) {
    enrichedTask = injectDependencyResults(task, suggestedDeps, stateCtx)
  }

  // ─── Mutation gate ───────────────────────────────────────────────────
  if (enrichedTask.actionType === 'write' || enrichedTask.actionType === 'transaction') {
    // Idempotency check
    const dedupeKey = getIdempotencyKey(context.sessionId, context.messageTs, enrichedTask.id)
    const dupeResult = checkDuplicate(dedupeKey)
    if (dupeResult.isDuplicate) {
      log?.info(
        `[Task Executor] Task ${enrichedTask.id} (${enrichedTask.intent}) is a duplicate, returning cached result`
      )
      return {
        taskId: enrichedTask.id,
        intent: enrichedTask.intent,
        status: 'deduplicated',
        data: dupeResult.cachedResult,
        latencyMs: 0
      }
    }

    // V2: async DB-based disambiguation gate
    const gate: GateResult = await canExecuteMutationV2(enrichedTask, enrichedTask.params)
    if (gate.blocked) {
      log?.info(`[Task Executor] Task ${enrichedTask.id} (${enrichedTask.intent}) blocked: ${gate.reason}`)
      return {
        taskId: enrichedTask.id,
        intent: enrichedTask.intent,
        status: 'blocked',
        reason: gate.reason,
        latencyMs: Date.now() - taskStart
      }
    }
  }

  // ─── Execute tool ────────────────────────────────────────────────────
  const executor = getToolExecutor(enrichedTask.intent, context)
  if (!executor) {
    return {
      taskId: enrichedTask.id,
      intent: enrichedTask.intent,
      status: 'failed',
      reason: `No executor found for intent: ${enrichedTask.intent}`,
      latencyMs: Date.now() - taskStart
    }
  }

  try {
    // V3: Wrap with retry for transient failures
    const data = await executeWithRetry(() => executor(enrichedTask.params))

    // Cache mutation result for idempotency
    if (enrichedTask.actionType === 'write' || enrichedTask.actionType === 'transaction') {
      const dedupeKey = getIdempotencyKey(context.sessionId, context.messageTs, enrichedTask.id)
      cacheMutationResult(dedupeKey, data)
    }

    return {
      taskId: enrichedTask.id,
      intent: enrichedTask.intent,
      status: 'completed',
      data,
      latencyMs: Date.now() - taskStart
    }
  } catch (error) {
    log?.error({ err: error, taskId: enrichedTask.id }, `[Task Executor] Task ${enrichedTask.intent} failed`)
    return {
      taskId: enrichedTask.id,
      intent: enrichedTask.intent,
      status: 'failed',
      reason: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - taskStart
    }
  }
}
