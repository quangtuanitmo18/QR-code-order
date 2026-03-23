import prisma from '@/database'
import { generateTextWithFallback } from '@/services/ai-provider.service'
import { getContextLogger } from '@/utils/logger'

/** Lightweight UIMessage-like shape stored in DB */
export interface UIMessageLike {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{ type: 'text'; text: string }>
}

/** Token usage info */
interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

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
  async getSession(
    sessionId: string
  ): Promise<{ messages: UIMessageLike[]; summary: string | null; summaryVersion: number }> {
    try {
      const session = await prisma.aiChatSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        return { messages: [], summary: null, summaryVersion: 0 }
      }

      return {
        messages: JSON.parse(session.messages),
        summary: session.summary,
        summaryVersion: session.summaryVersion
      }
    } catch (error) {
      const log = getContextLogger()
      log?.error({ err: error }, `[AI Memory] Error getting session ${sessionId}`)
      return { messages: [], summary: null, summaryVersion: 0 } // Return empty gracefully
    }
  }

  /**
   * Save or update a session with new messages and optional token usage.
   */
  async saveSession(
    sessionId: string,
    messages: UIMessageLike[],
    userId?: { guestId?: number; accountId?: number },
    usage?: TokenUsage,
    summary?: string | null,
    summaryVersion?: number
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
          ...(summary !== undefined && { summary }),
          ...(summaryVersion !== undefined && { summaryVersion }),
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
          summary: summary || null,
          summaryVersion: summaryVersion || 0,
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
              ...(summary !== undefined && { summary }),
              ...(summaryVersion !== undefined && { summaryVersion }),
              ...(usage && {
                promptTokens: { increment: usage.promptTokens },
                completionTokens: { increment: usage.completionTokens },
                totalTokens: { increment: usage.totalTokens }
              })
            },
            create: {
              id: sessionId,
              messages: JSON.stringify(messages),
              summary: summary || null,
              summaryVersion: summaryVersion || 0,
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
   * Replace applySlidingWindow: Splits history into the hot window and the newly evicted messages.
   * Ensures the system prompt (if present) is always kept at index 0 of hotMessages.
   */
  buildContextWithSummary(
    messages: UIMessageLike[],
    maxMessages = 8
  ): {
    hotMessages: UIMessageLike[]
    evictedMessages: UIMessageLike[]
  } {
    if (messages.length <= maxMessages) {
      return { hotMessages: messages, evictedMessages: [] }
    }

    const hasSystemMessage = messages[0]?.role === 'system'

    if (hasSystemMessage) {
      // Keep system prompt, and take the last (maxMessages - 1) messages
      const hotMessages = [messages[0], ...messages.slice(-(maxMessages - 1))]
      // The evicted messages are everything between the system message and the hot window
      const evictedMessages = messages.slice(1, -(maxMessages - 1))
      return { hotMessages, evictedMessages }
    }

    // No system prompt, just take the last maxMessages
    const hotMessages = messages.slice(-maxMessages)
    const evictedMessages = messages.slice(0, -maxMessages)
    return { hotMessages, evictedMessages }
  }

  /**
   * Generates a progressive summary summarizing evicted messages on top of the existing summary.
   */
  async generateProgressiveSummary(existingSummary: string | null, evictedMessages: UIMessageLike[]): Promise<string> {
    if (evictedMessages.length === 0) {
      return existingSummary || ''
    }

    const evictedText = evictedMessages
      .map((m) => {
        // Omit system messages from summary
        if (m.role === 'system') return null
        const text = m.parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join(' ')
        return `${m.role.toUpperCase()}: ${text}`
      })
      .filter(Boolean)
      .join('\n')

    const prompt = `Summarize the following conversation segment concisely.
Keep: Key facts, user preferences, decisions, order details, allergies, language spoken.
Drop: Greetings, filler words, repeated information, generic statements.

Previous Summary:
${existingSummary || 'None.'}

New Conversation Segment to INCORPORATE into the summary:
${evictedText}

Updated Comprehensive Summary (max 200 words, use clear and direct language):`

    try {
      const result = await generateTextWithFallback(
        {
          prompt,
          maxOutputTokens: 300 // Keep summary short
        },
        'openai/gpt-oss-120b',
        'google/gemini-2.5-flash'
      )

      return result.text.trim()
    } catch (error) {
      const log = getContextLogger()
      log?.error({ err: error }, '[AI Memory] Error generating progressive summary')
      // Fallback: return existing summary so we don't lose the old context
      return existingSummary || ''
    }
  }
}

export const aiMemoryService = new AiMemoryService()
