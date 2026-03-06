/**
 * AI Security Middleware
 * Detects prompt injection attacks and validates message content.
 */

import { getContextLogger } from '@/utils/logger'

// Common prompt injection patterns (case-insensitive)
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /forget\s+(all\s+)?(previous|above|prior)/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+(a\s+)?different/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions)/i,
  /show\s+(me\s+)?(your\s+)?(system\s+)?(prompt|instructions)/i,
  /what\s+(are|is)\s+(your\s+)?(system\s+)?(prompt|instructions)/i,
  /override\s+(your\s+)?(instructions|rules|guidelines)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i
]

/**
 * Check if text contains prompt injection patterns.
 */
function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text))
}

/**
 * Validate message content for security and sanity.
 */
export function validateMessageContent(messages: Array<{ role: string; content: string }>): {
  valid: boolean
  error?: string
} {
  // 1. Max message count
  if (messages.length > 50) {
    return { valid: false, error: 'Too many messages. Please start a new conversation.' }
  }

  // 2. Check each user message
  for (const msg of messages) {
    if (msg.role !== 'user') continue

    // Max message length (4000 chars)
    if (msg.content.length > 4000) {
      return { valid: false, error: 'Message too long. Please keep it under 4000 characters.' }
    }

    // Prompt injection detection
    if (detectPromptInjection(msg.content)) {
      const log = getContextLogger()
      log?.warn(`[AI Security] Prompt injection detected: ${msg.content.substring(0, 100)}`)
      return { valid: false, error: 'Your message contains content that is not allowed.' }
    }
  }

  return { valid: true }
}
