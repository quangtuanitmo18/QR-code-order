import prisma from '@/database'
import { Cron } from 'croner'

// Cron pattern: every Monday at 3:00 AM — cleanup traces older than 30 days

const cleanupExecutionTraceJob = (fastify: any) => {
  Cron('0 3 * * 1', async () => {
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)

      const result = await prisma.executionTrace.deleteMany({
        where: {
          createdAt: {
            lt: cutoff
          }
        }
      })
      fastify.log.info(`[Cleanup Execution Trace] Deleted ${result.count} traces older than 30 days`)
    } catch (error) {
      fastify.log.error({ err: error }, '[Cleanup Execution Trace] Error:')
    }
  })
}

export default cleanupExecutionTraceJob
