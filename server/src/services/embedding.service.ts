import envConfig, { API_URL } from '@/config'

/**
 * Embedding Service
 * Creates vector embeddings via OpenRouter API using text-embedding-3-large model.
 * Pattern from learn-ai-engineer/embeddings.service.ts
 */
class EmbeddingService {
  private readonly baseURL = 'https://openrouter.ai/api/v1'
  private readonly model = 'text-embedding-3-large'

  /**
   * Create embeddings for an array of texts.
   * @returns Array of embedding vectors (number[][])
   */
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    if (!envConfig.OPENROUTER_API_KEY) {
      throw new Error('[Embedding] OPENROUTER_API_KEY is not configured')
    }

    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${envConfig.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': API_URL,
          'X-Title': 'QR Order - AI Assistant'
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
        data: Array<{ embedding: number[] }>
      }

      console.log(`[Embedding] Created ${data.data.length} embeddings (model: ${this.model})`)

      return data.data.map((item) => item.embedding)
    } catch (error) {
      console.error('[Embedding] Error creating embeddings:', error)
      throw error
    }
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
