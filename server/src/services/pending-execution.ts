import type { DAGNode, EnrichedTask, StateContext } from '@/services/task-policy'
import { getContextLogger } from '@/utils/logger'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PendingExecution {
  sessionId: string
  dag: Map<string, DAGNode>
  stateCtx: StateContext
  blockedTaskId: string
  blockedReason: string
  completedTaskIds: Set<string>
  enrichedTasks: EnrichedTask[]
  suggestedDeps: { from: string; to: string }[]
  originalMessage: string
  createdAt: number
}

// ─── In-Memory Store ─────────────────────────────────────────────────────────

const pendingExecutions = new Map<string, PendingExecution>()
const PENDING_TTL_MS = 5 * 60_000 // 5 minutes

export function savePendingExecution(sessionId: string, pending: Omit<PendingExecution, 'createdAt'>): void {
  const log = getContextLogger()
  pendingExecutions.set(sessionId, { ...pending, createdAt: Date.now() })
  log?.info(`[Pending] Saved pending execution for session ${sessionId}, blocked on task ${pending.blockedTaskId}`)
}

export function getPendingExecution(sessionId: string): PendingExecution | null {
  const pending = pendingExecutions.get(sessionId)
  if (!pending) return null

  if (Date.now() - pending.createdAt > PENDING_TTL_MS) {
    pendingExecutions.delete(sessionId)
    getContextLogger()?.info(`[Pending] Expired pending execution for session ${sessionId}`)
    return null
  }

  return pending
}

export function clearPendingExecution(sessionId: string): void {
  pendingExecutions.delete(sessionId)
  getContextLogger()?.info(`[Pending] Cleared pending execution for session ${sessionId}`)
}

// ─── Periodic Cleanup (every 60s) ────────────────────────────────────────────

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of pendingExecutions) {
    if (now - val.createdAt > PENDING_TTL_MS) {
      pendingExecutions.delete(key)
    }
  }
}, 60_000)
