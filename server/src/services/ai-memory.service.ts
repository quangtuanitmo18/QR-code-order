import prisma from '@/database'
import { getContextLogger } from '@/utils/logger'

class AiMemoryService {
  private readonly cleanupIntervalMs = 12 * 60 * 60 * 1000 // 12 hours
  private readonly sessionRetentionMs = 24 * 60 * 60 * 1000 // 24 hours
  private timer: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanupJob()
  }

  /**
   * Starts a background job to periodically delete sessions older than 24 hours.
   */
  private startCleanupJob() {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(async () => {
      try {
        const thresholdDate = new Date(Date.now() - this.sessionRetentionMs)
        const result = await prisma.aiChatSession.deleteMany({
          where: {
            updatedAt: {
              lt: thresholdDate
            }
          }
        })
        if (result.count > 0) {
          const log = getContextLogger()
          log?.info(`[AI Memory] Auto-cleanup: Deleted ${result.count} old chat sessions.`)
        }
      } catch (error) {
        const log = getContextLogger()
        log?.error({ err: error }, '[AI Memory] Error during auto-cleanup')
      }
    }, this.cleanupIntervalMs)
  }

  /**
   * Stop the cleanup job (useful for graceful shutdown)
   */
  stopCleanupJob() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * Get an existing session by ID.
   */
  async getSession(sessionId: string): Promise<any[]> {
    try {
      const session = await prisma.aiChatSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        return []
      }

      return JSON.parse(session.messages)
    } catch (error) {
      const log = getContextLogger()
      log?.error({ err: error }, `[AI Memory] Error getting session ${sessionId}`)
      return [] // Return empty array on error to gracefully fallback
    }
  }

  /**
   * Save or update a session with new messages and optional token usage.
   */
  async saveSession(
    sessionId: string,
    messages: any[],
    userId?: { guestId?: number; accountId?: number },
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
  ) {
    try {
      // Build user connection data — only include if IDs actually exist
      const userUpdateData: Record<string, any> = {}
      const userCreateData: Record<string, any> = {}

      if (userId?.guestId) {
        userUpdateData.guestId = userId.guestId
        userCreateData.guestId = userId.guestId
      }
      if (userId?.accountId) {
        userUpdateData.accountId = userId.accountId
        userCreateData.accountId = userId.accountId
      }

      await prisma.aiChatSession.upsert({
        where: { id: sessionId },
        update: {
          messages: JSON.stringify(messages),
          ...userUpdateData,
          ...(usage && {
            promptTokens: { increment: usage.promptTokens },
            completionTokens: { increment: usage.completionTokens },
            totalTokens: { increment: usage.totalTokens }
          })
        },
        create: {
          id: sessionId,
          messages: JSON.stringify(messages),
          ...userCreateData,
          promptTokens: usage?.promptTokens || 0,
          completionTokens: usage?.completionTokens || 0,
          totalTokens: usage?.totalTokens || 0
        }
      })
    } catch (error: any) {
      // FK constraint failed (P2003) — guest/account ID doesn't exist in DB
      // Retry without user link so we still persist messages + token usage
      if (error?.code === 'P2003') {
        const log = getContextLogger()
        log?.warn(`[AI Memory] FK constraint failed for session ${sessionId}, saving without user link`)
        try {
          await prisma.aiChatSession.upsert({
            where: { id: sessionId },
            update: {
              messages: JSON.stringify(messages),
              ...(usage && {
                promptTokens: { increment: usage.promptTokens },
                completionTokens: { increment: usage.completionTokens },
                totalTokens: { increment: usage.totalTokens }
              })
            },
            create: {
              id: sessionId,
              messages: JSON.stringify(messages),
              promptTokens: usage?.promptTokens || 0,
              completionTokens: usage?.completionTokens || 0,
              totalTokens: usage?.totalTokens || 0
            }
          })
        } catch (retryError) {
          const log2 = getContextLogger()
          log2?.error({ err: retryError }, `[AI Memory] Retry also failed for session ${sessionId}`)
        }
      } else {
        const log = getContextLogger()
        log?.error({ err: error }, `[AI Memory] Error saving session ${sessionId}`)
      }
    }
  }

  /**
   * Get total tokens consumed by a session.
   */
  async getSessionTokens(sessionId: string): Promise<number> {
    try {
      const session = await prisma.aiChatSession.findUnique({
        where: { id: sessionId },
        select: { totalTokens: true }
      })
      return session?.totalTokens || 0
    } catch {
      return 0
    }
  }

  /**
   * Sliding window to preserve context size.
   * Ensures the system prompt (if present) is always kept at index 0.
   */
  applySlidingWindow(messages: any[], maxMessages = 20): any[] {
    if (messages.length <= maxMessages) {
      return messages
    }

    const hasSystemMessage = messages[0]?.role === 'system'

    if (hasSystemMessage) {
      // Keep system prompt, and take the last (maxMessages - 1) messages
      return [messages[0], ...messages.slice(messages.length - (maxMessages - 1))]
    }

    // No system prompt, just take the last maxMessages
    return messages.slice(messages.length - maxMessages)
  }
}

export const aiMemoryService = new AiMemoryService()
