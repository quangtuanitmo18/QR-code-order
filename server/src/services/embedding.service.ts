import envConfig from '@/config'
import { getContextLogger } from '@/utils/logger'

/**
 * Embedding Service
 * Creates vector embeddings via Google Generative AI API using gemini-embedding-001 model.
 * Uses Google's OpenAI-compatible endpoint.
 * Includes retry logic for resilience.
 */
class EmbeddingService {
  private readonly baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai'
  private readonly model = 'gemini-embedding-001'

  /**
   * Retry helper — retries a function once after a 1s delay.
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
    const log = getContextLogger()
    try {
      return await fn()
    } catch (error) {
      if (retries > 0) {
        log?.warn(`[Embedding] Retrying after error... (${retries} retries left)`)
        await new Promise((r) => setTimeout(r, 1000))
        return this.withRetry(fn, retries - 1)
      }
      throw error
    }
  }

  /**
   * Create embeddings for an array of texts.
   * Includes 1 retry with 1s backoff for resilience.
   */
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    if (!envConfig.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('[Embedding] GOOGLE_GENERATIVE_AI_API_KEY is not configured')
    }

    return this.withRetry(async () => {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${envConfig.GOOGLE_GENERATIVE_AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: texts
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          (errorData as { error?: { message?: string } }).error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const data = (await response.json()) as {
        data?: Array<{ embedding: number[] }>
      }

      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        const log = getContextLogger()
        log?.error(
          { responseBody: JSON.stringify(data).slice(0, 500) },
          '[Embedding] Unexpected API response — no embeddings returned'
        )
        throw new Error('[Embedding] API returned no embeddings. Response may be rate-limited or malformed.')
      }

      const log = getContextLogger()
      log?.info(`[Embedding] Created ${data.data.length} embeddings (model: ${this.model})`)

      return data.data.map((item) => item.embedding)
    })
  }

  /**
   * Create a single embedding for a query string.
   */
  async createQueryEmbedding(query: string): Promise<number[]> {
    const embeddings = await this.createEmbeddings([query])
    return embeddings[0]
  }
}

export const embeddingService = new EmbeddingService()
