import prisma from '@/database'
import { getContextLogger } from '@/utils/logger'

// ─── Types ───────────────────────────────────────────────────────────────────

interface IntentCombo {
  intents: string[]
  count: number
}

interface LatencyByIntent {
  intent: string
  avgMs: number
  maxMs: number
  count: number
}

interface FailureRate {
  intent: string
  total: number
  failed: number
  blocked: number
  rate: number
}

interface BlockedReason {
  reason: string
  count: number
}

export interface TraceAnalytics {
  topCombos: IntentCombo[]
  latencyByIntent: LatencyByIntent[]
  failureRates: FailureRate[]
  blockedReasons: BlockedReason[]
  totalTraces: number
  periodDays: number
}

// ─── Analytics Queries ───────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

/** Get top multi-intent combinations by frequency */
export async function getTopMultiIntentCombos(days = 30, limit = 10): Promise<IntentCombo[]> {
  const traces = await prisma.executionTrace.findMany({
    where: { createdAt: { gte: daysAgo(days) } },
    select: { traceData: true }
  })

  const comboCounts = new Map<string, number>()
  for (const trace of traces) {
    try {
      const data = JSON.parse(trace.traceData)
      const intents = (data.detectedTasks || []).map((t: any) => t.intent).sort()
      const key = intents.join('+')
      comboCounts.set(key, (comboCounts.get(key) || 0) + 1)
    } catch {
      // skip malformed trace
    }
  }

  return [...comboCounts.entries()]
    .map(([key, count]) => ({ intents: key.split('+'), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/** Get average latency per intent */
export async function getAvgLatencyByIntent(days = 30): Promise<LatencyByIntent[]> {
  const traces = await prisma.executionTrace.findMany({
    where: { createdAt: { gte: daysAgo(days) } },
    select: { traceData: true }
  })

  const intentStats = new Map<string, { totalMs: number; maxMs: number; count: number }>()
  for (const trace of traces) {
    try {
      const data = JSON.parse(trace.traceData)
      for (const result of data.results || []) {
        const stats = intentStats.get(result.intent) || { totalMs: 0, maxMs: 0, count: 0 }
        stats.totalMs += result.latencyMs || 0
        stats.maxMs = Math.max(stats.maxMs, result.latencyMs || 0)
        stats.count++
        intentStats.set(result.intent, stats)
      }
    } catch {
      // skip malformed trace
    }
  }

  return [...intentStats.entries()]
    .map(([intent, stats]) => ({
      intent,
      avgMs: Math.round(stats.totalMs / stats.count),
      maxMs: stats.maxMs,
      count: stats.count
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
}

/** Get failure/blocked rates per intent */
export async function getFailureRates(days = 30): Promise<FailureRate[]> {
  const traces = await prisma.executionTrace.findMany({
    where: { createdAt: { gte: daysAgo(days) } },
    select: { traceData: true }
  })

  const intentStats = new Map<string, { total: number; failed: number; blocked: number }>()
  for (const trace of traces) {
    try {
      const data = JSON.parse(trace.traceData)
      for (const result of data.results || []) {
        const stats = intentStats.get(result.intent) || { total: 0, failed: 0, blocked: 0 }
        stats.total++
        if (result.status === 'failed') stats.failed++
        if (result.status === 'blocked') stats.blocked++
        intentStats.set(result.intent, stats)
      }
    } catch {
      // skip
    }
  }

  return [...intentStats.entries()]
    .map(([intent, stats]) => ({
      intent,
      total: stats.total,
      failed: stats.failed,
      blocked: stats.blocked,
      rate: Math.round(((stats.failed + stats.blocked) / stats.total) * 100)
    }))
    .sort((a, b) => b.rate - a.rate)
}

/** Get top blocked task reasons */
export async function getBlockedReasons(days = 30): Promise<BlockedReason[]> {
  const traces = await prisma.executionTrace.findMany({
    where: { createdAt: { gte: daysAgo(days) } },
    select: { traceData: true }
  })

  const reasonCounts = new Map<string, number>()
  for (const trace of traces) {
    try {
      const data = JSON.parse(trace.traceData)
      for (const result of data.results || []) {
        if (result.status === 'blocked' && result.reason) {
          reasonCounts.set(result.reason, (reasonCounts.get(result.reason) || 0) + 1)
        }
      }
    } catch {
      // skip
    }
  }

  return [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
}

/** Get full analytics summary */
export async function getTraceAnalytics(days = 30): Promise<TraceAnalytics> {
  const log = getContextLogger()
  const startTime = Date.now()

  const [topCombos, latencyByIntent, failureRates, blockedReasons, totalTraces] = await Promise.all([
    getTopMultiIntentCombos(days),
    getAvgLatencyByIntent(days),
    getFailureRates(days),
    getBlockedReasons(days),
    prisma.executionTrace.count({ where: { createdAt: { gte: daysAgo(days) } } })
  ])

  log?.info(`[Analytics] Generated trace analytics in ${Date.now() - startTime}ms`)

  return { topCombos, latencyByIntent, failureRates, blockedReasons, totalTraces, periodDays: days }
}
