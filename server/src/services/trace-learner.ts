import prisma from '@/database'
import { getContextLogger } from '@/utils/logger'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WhitelistSuggestion {
  intentA: string
  intentB: string
  sampleCount: number
  conflictCount: number
  recommendation: 'add' | 'review'
}

// ─── Learning from Traces ────────────────────────────────────────────────────

/**
 * Analyze execution traces to find read+read intent pairs that ran
 * in parallel consistently without conflicts. Suggests whitelist additions.
 *
 * Advisory only — human must approve changes.
 */
export async function suggestWhitelistExpansions(
  minSamples = 50,
  days = 90,
  existingPairs: [string, string][] = []
): Promise<WhitelistSuggestion[]> {
  const log = getContextLogger()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const traces = await prisma.executionTrace.findMany({
    where: { createdAt: { gte: cutoff }, taskCount: { gte: 2 } },
    select: { traceData: true }
  })

  // Build a set of existing pairs for quick lookup
  const existingSet = new Set(existingPairs.map(([a, b]) => [a, b].sort().join('+')))

  // Count parallel read+read pair occurrences and failures
  const pairStats = new Map<string, { count: number; conflicts: number }>()

  for (const trace of traces) {
    try {
      const data = JSON.parse(trace.traceData)
      const tasks = data.detectedTasks || []
      const results = data.results || []

      // Find all read+read pairs
      const reads = tasks.filter((t: any) => t.actionType === 'read')
      for (let i = 0; i < reads.length; i++) {
        for (let j = i + 1; j < reads.length; j++) {
          const key = [reads[i].intent, reads[j].intent].sort().join('+')

          // Skip already-whitelisted pairs
          if (existingSet.has(key)) continue

          const stats = pairStats.get(key) || { count: 0, conflicts: 0 }
          stats.count++

          // Check if either task in the pair failed
          const iResult = results.find((r: any) => r.taskId === reads[i].id)
          const jResult = results.find((r: any) => r.taskId === reads[j].id)
          if (iResult?.status === 'failed' || jResult?.status === 'failed') {
            stats.conflicts++
          }

          pairStats.set(key, stats)
        }
      }
    } catch {
      // skip malformed trace
    }
  }

  // Generate suggestions
  const suggestions: WhitelistSuggestion[] = []
  for (const [key, stats] of pairStats) {
    if (stats.count < minSamples) continue

    const [intentA, intentB] = key.split('+')
    suggestions.push({
      intentA,
      intentB,
      sampleCount: stats.count,
      conflictCount: stats.conflicts,
      recommendation: stats.conflicts === 0 ? 'add' : 'review'
    })
  }

  suggestions.sort((a, b) => b.sampleCount - a.sampleCount)

  if (suggestions.length > 0) {
    log?.info({ suggestions }, `[Trace Learner] Found ${suggestions.length} whitelist expansion suggestions`)
  }

  return suggestions
}
