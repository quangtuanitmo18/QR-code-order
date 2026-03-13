import crypto from 'node:crypto'

/**
 * Convert raw client messages to UIMessage-like format for convertToModelMessages.
 * Shared between guest AI chat service and admin AI chat service.
 */
export function toUIMessages(
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
) {
  const turnId = crypto.randomUUID().slice(0, 8)
  return messages.map((msg, index) => {
    const parts: Array<{ type: 'text'; text: string }> = []

    if (typeof msg.content === 'string' && msg.content) {
      parts.push({ type: 'text' as const, text: msg.content })
    } else if (msg.parts) {
      for (const p of msg.parts) {
        if (p.type === 'text' && p.text) {
          parts.push({ type: 'text' as const, text: p.text })
        }
      }
    }

    if (parts.length === 0) {
      parts.push({ type: 'text' as const, text: '' })
    }

    return {
      id: `msg-${turnId}-${index}`,
      role: msg.role as 'user' | 'assistant',
      parts
    }
  })
}
