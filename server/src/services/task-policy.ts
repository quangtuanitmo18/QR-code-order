import { getContextLogger } from '@/utils/logger'
import prisma from '@/database'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskPolicy {
  actionType: 'read' | 'write' | 'transaction'
  resource: string
  requiresConfirmation: boolean
}

export interface RawTask {
  id: string
  intent: string
  params: Record<string, unknown>
}

export interface EnrichedTask extends RawTask {
  actionType: 'read' | 'write' | 'transaction'
  resource: string
  requiresConfirmation: boolean
}

export interface ExecutionStage {
  stage: number
  taskIds: string[]
  mode: 'parallel' | 'sequential'
}

export interface GateResult {
  blocked: boolean
  reason?: 'multiple_candidates' | 'needs_confirmation' | 'missing_params'
  action?: 'ask_user' | 'abort'
}

// ─── V2: DAG + State types ───────────────────────────────────────────────────

export interface DAGNode {
  task: EnrichedTask
  dependsOn: Set<string>
  dependedBy: Set<string>
}

export interface StateContext {
  taskResults: Map<string, unknown>
}

// ─── Intent Metadata Registry (code defaults + config override) ─────────────

const CODE_DEFAULT_POLICIES: Record<string, TaskPolicy> = {
  search_product: { actionType: 'read', resource: 'catalog', requiresConfirmation: false },
  search_faq: { actionType: 'read', resource: 'faq', requiresConfirmation: false },
  get_restaurant_info: { actionType: 'read', resource: 'settings', requiresConfirmation: false },
  get_order_status: { actionType: 'read', resource: 'order', requiresConfirmation: false },
  get_available_coupons: { actionType: 'read', resource: 'coupon', requiresConfirmation: false },
  place_order: { actionType: 'write', resource: 'order', requiresConfirmation: true },
  cancel_order: { actionType: 'write', resource: 'order', requiresConfirmation: true },
  apply_coupon: { actionType: 'write', resource: 'coupon', requiresConfirmation: false },
  general_chat: { actionType: 'read', resource: 'general', requiresConfirmation: false }
}

const CODE_DEFAULT_PAIRS: [string, string][] = [
  ['search_product', 'search_faq'],
  ['search_product', 'get_restaurant_info'],
  ['search_product', 'get_order_status'],
  ['search_product', 'get_available_coupons'],
  ['search_faq', 'get_restaurant_info'],
  ['get_order_status', 'get_restaurant_info'],
  ['get_order_status', 'get_available_coupons']
]

// V3: Load from config file, merge with code defaults
function loadPoliciesFromConfig(): {
  policies: Record<string, TaskPolicy>
  pairs: [string, string][]
} {
  try {
    const configPath = path.resolve(__dirname, '../../config/task-policies.json')
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

    // Validate and merge
    const policies: Record<string, TaskPolicy> = { ...CODE_DEFAULT_POLICIES }
    if (raw.policies && typeof raw.policies === 'object') {
      for (const [key, val] of Object.entries(raw.policies)) {
        const v = val as any
        if (v.actionType && v.resource && typeof v.requiresConfirmation === 'boolean') {
          policies[key] = v
        }
      }
    }

    const pairs: [string, string][] = Array.isArray(raw.parallelSafePairs) ? raw.parallelSafePairs : CODE_DEFAULT_PAIRS

    getContextLogger()?.info(`[Policy] Loaded ${Object.keys(policies).length} policies from config`)
    return { policies, pairs }
  } catch {
    getContextLogger()?.warn('[Policy] Config load failed, using code defaults')
    return { policies: CODE_DEFAULT_POLICIES, pairs: CODE_DEFAULT_PAIRS }
  }
}

// Initialize lazily (avoids noisy errors at module load when config file doesn't exist)
let _configCache: { policies: Record<string, TaskPolicy>; pairs: [string, string][] } | null = null
function getConfig() {
  if (!_configCache) _configCache = loadPoliciesFromConfig()
  return _configCache
}

export function getTaskPolicies(): Record<string, TaskPolicy> {
  return getConfig().policies
}

// ─── V1: Whitelist-based parallel rules ──────────────────────────────────────

function getParallelSafePairs(): [string, string][] {
  return getConfig().pairs
}

// ─── Enrich: LLM output → code-enriched task ────────────────────────────────

export function enrichTask(raw: RawTask): EnrichedTask {
  const policy = getTaskPolicies()[raw.intent]
  if (!policy) {
    getContextLogger()?.warn(`[Policy Engine] Unknown intent "${raw.intent}", defaulting to read/general`)
    return {
      ...raw,
      actionType: 'read',
      resource: 'general',
      requiresConfirmation: false
    }
  }
  return { ...raw, ...policy }
}

export function enrichTasks(rawTasks: RawTask[]): EnrichedTask[] {
  return rawTasks.map(enrichTask)
}

// ─── V1: Whitelist-based parallel rules (O(n) scan, n=7 pairs) ──────────────

function isPairSafeForParallel(intentA: string, intentB: string): boolean {
  return getParallelSafePairs().some(
    ([a, b]: [string, string]) => (a === intentA && b === intentB) || (a === intentB && b === intentA)
  )
}

// ─── V2: Resource-based auto-detect (fallback for unlisted pairs) ────────────

function canRunInParallel(a: EnrichedTask, b: EnrichedTask): boolean {
  if (a.actionType !== 'read' || b.actionType !== 'read') return false
  if (a.resource === b.resource) return false
  return true
}

/** V2 hybrid: whitelist fast-path → resource-based fallback */
export function shouldRunParallel(a: EnrichedTask, b: EnrichedTask): boolean {
  // O(1) fast-path: battle-tested V1 whitelist
  if (isPairSafeForParallel(a.intent, b.intent)) return true
  // Fallback: auto-detect for new/unlisted read intents on different resources
  return canRunInParallel(a, b)
}

/**
 * Build an execution plan from enriched tasks.
 *
 * Strategy (V1):
 * 1. Group all read tasks first, write/transaction tasks after
 * 2. Within reads: check if ALL pairs in the group are safe for parallel
 *    - If yes → single parallel stage
 *    - If not → sequential stages
 * 3. Write/transaction tasks are always sequential, each in its own stage
 * 4. Respect suggestedDependencies from planner (code validates)
 */
export function buildExecutionPlan(
  tasks: EnrichedTask[],
  suggestedDeps?: { from: string; to: string }[]
): ExecutionStage[] {
  const log = getContextLogger()
  const stages: ExecutionStage[] = []

  // Separate reads from writes
  const reads = tasks.filter((t) => t.actionType === 'read')
  const writes = tasks.filter((t) => t.actionType === 'write' || t.actionType === 'transaction')

  // Check if any read depends on another task (from suggestedDeps)
  const dependentReadIds = new Set<string>()
  if (suggestedDeps) {
    for (const dep of suggestedDeps) {
      const toTask = tasks.find((t) => t.id === dep.to)
      if (toTask?.actionType === 'read') {
        dependentReadIds.add(dep.to)
      }
    }
  }

  // Independent reads (no dependencies)
  const independentReads = reads.filter((r) => !dependentReadIds.has(r.id))
  const dependentReads = reads.filter((r) => dependentReadIds.has(r.id))

  // Stage N: independent reads (check if all pairs are parallel-safe via hybrid check)
  if (independentReads.length > 0) {
    let canParallel = true
    if (independentReads.length > 1) {
      for (let i = 0; i < independentReads.length; i++) {
        for (let j = i + 1; j < independentReads.length; j++) {
          if (!shouldRunParallel(independentReads[i], independentReads[j])) {
            canParallel = false
            break
          }
        }
        if (!canParallel) break
      }
    }

    if (canParallel && independentReads.length > 1) {
      stages.push({
        stage: stages.length + 1,
        taskIds: independentReads.map((t) => t.id),
        mode: 'parallel'
      })
    } else {
      // Sequential reads
      for (const task of independentReads) {
        stages.push({
          stage: stages.length + 1,
          taskIds: [task.id],
          mode: 'sequential'
        })
      }
    }
  }

  // Dependent reads: each in their own sequential stage
  for (const task of dependentReads) {
    stages.push({
      stage: stages.length + 1,
      taskIds: [task.id],
      mode: 'sequential'
    })
  }

  // Write/transaction tasks: each in its own sequential stage
  for (const task of writes) {
    stages.push({
      stage: stages.length + 1,
      taskIds: [task.id],
      mode: 'sequential'
    })
  }

  log?.info(
    { stageCount: stages.length, readCount: reads.length, writeCount: writes.length },
    '[Policy Engine] Built execution plan'
  )
  return stages
}

// ─── Disambiguation Gate (V1: sync heuristic) ──────────────────────────────

export function canExecuteMutation(task: EnrichedTask, resolvedParams: Record<string, unknown>): GateResult {
  // Check: requires confirmation but not confirmed
  if (task.requiresConfirmation && !resolvedParams.confirmed) {
    return { blocked: true, reason: 'needs_confirmation', action: 'ask_user' }
  }

  // Intent-specific checks
  if (task.intent === 'place_order') {
    const items = resolvedParams.items as Array<{ dishName: string }> | undefined
    if (!items || items.length === 0) {
      return { blocked: true, reason: 'missing_params', action: 'ask_user' }
    }
    // Block if any dish name is too short/ambiguous (likely matches multiple candidates)
    const ambiguousItem = items.find((item) => !item.dishName || item.dishName.length <= 2)
    if (ambiguousItem) {
      return { blocked: true, reason: 'multiple_candidates', action: 'ask_user' }
    }
  }

  if (task.intent === 'cancel_order' && !resolvedParams.orderId) {
    return { blocked: true, reason: 'missing_params', action: 'ask_user' }
  }

  return { blocked: false }
}

// ─── Disambiguation Gate (V2: async DB-based) ───────────────────────────────

export async function canExecuteMutationV2(
  task: EnrichedTask,
  resolvedParams: Record<string, unknown>
): Promise<GateResult> {
  const log = getContextLogger()

  if (task.requiresConfirmation && !resolvedParams.confirmed) {
    return { blocked: true, reason: 'needs_confirmation', action: 'ask_user' }
  }

  if (task.intent === 'place_order') {
    const items = resolvedParams.items as Array<{ dishName: string }> | undefined
    if (!items || items.length === 0) {
      return { blocked: true, reason: 'missing_params', action: 'ask_user' }
    }

    // V3: Skip DB gate if auto-picked from prior read (exactly 1 match)
    if (resolvedParams.__autoPickedResult) {
      log?.info('[Gate V2] Auto-picked result available, skipping DB disambiguation')
      return { blocked: false }
    }

    // V2: check each item against real DB for actual match count
    for (const item of items) {
      if (!item.dishName) {
        return { blocked: true, reason: 'missing_params', action: 'ask_user' }
      }
      try {
        const count = await prisma.dish.count({
          where: {
            name: { contains: item.dishName.toLowerCase() },
            status: 'Available'
          }
        })
        if (count === 0) {
          log?.info(`[Gate V2] No dishes found for "${item.dishName}", blocking`)
          return { blocked: true, reason: 'missing_params', action: 'ask_user' }
        }
        if (count > 1) {
          log?.info(`[Gate V2] ${count} dishes match "${item.dishName}", blocking`)
          return { blocked: true, reason: 'multiple_candidates', action: 'ask_user' }
        }
      } catch (err) {
        log?.warn({ err }, '[Gate V2] DB query failed, falling back to V1 heuristic')
        // Fallback to V1 sync check on DB failure
        return canExecuteMutation(task, resolvedParams)
      }
    }
  }

  if (task.intent === 'cancel_order' && !resolvedParams.orderId) {
    return { blocked: true, reason: 'missing_params', action: 'ask_user' }
  }

  return { blocked: false }
}

// ─── Idempotency ─────────────────────────────────────────────────────────────

const recentMutations = new Map<string, { result: unknown; timestamp: number }>()
const DEDUPE_TTL_MS = 30_000

export function getIdempotencyKey(sessionId: string, messageTs: number, taskId: string): string {
  return crypto.createHash('sha256').update(`${sessionId}:${messageTs}:${taskId}`).digest('hex')
}

export function checkDuplicate(key: string): { isDuplicate: boolean; cachedResult?: unknown } {
  const existing = recentMutations.get(key)
  if (!existing) return { isDuplicate: false }
  if (Date.now() - existing.timestamp > DEDUPE_TTL_MS) {
    recentMutations.delete(key)
    return { isDuplicate: false }
  }
  return { isDuplicate: true, cachedResult: existing.result }
}

export function cacheMutationResult(key: string, result: unknown): void {
  recentMutations.set(key, { result, timestamp: Date.now() })

  // Periodic cleanup: remove stale entries
  if (recentMutations.size > 100) {
    const now = Date.now()
    for (const [k, v] of recentMutations) {
      if (now - v.timestamp > DEDUPE_TTL_MS) recentMutations.delete(k)
    }
  }
}
