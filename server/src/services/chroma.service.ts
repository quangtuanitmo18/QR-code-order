import envConfig from '@/config'
import { ChromaClient } from 'chromadb'

/**
 * ChromaDB Service
 * Manages vector storage and semantic search using ChromaDB Cloud.
 * Pattern from learn-ai-engineer/vector-db.service.ts
 */
class ChromaService {
  private client: ChromaClient
  private readonly collectionName = 'restaurant_menu'
  private collection: any = null // Cache the collection instance

  constructor() {
    this.client = new ChromaClient({
      host: `https://${envConfig.CHROMA_HOST}`,
      headers: {
        'x-chroma-token': envConfig.CHROMA_API_KEY
      },
      tenant: envConfig.CHROMA_TENANT,
      database: envConfig.CHROMA_DATABASE
    })
  }

  /**
   * Get or create the restaurant menu collection.
   */
  async getCollection() {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      })
    }
    return this.collection
  }

  /**
   * Upsert documents (dishes) into ChromaDB with their embeddings.
   */
  async upsertDocuments(
    ids: string[],
    embeddings: number[][],
    documents: string[],
    metadatas: Array<Record<string, string>>
  ) {
    const collection = await this.getCollection()

    await collection.upsert({
      ids,
      embeddings,
      documents,
      metadatas
    })

    console.log(`[ChromaDB] Upserted ${ids.length} documents into "${this.collectionName}"`)
  }

  /**
   * Semantic search — query ChromaDB with an embedding vector.
   * Returns top K most similar documents.
   */
  async queryDocuments(queryEmbedding: number[], topK = 5) {
    const collection = await this.getCollection()

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK
    })

    return results
  }

  /**
   * Query using raw text — ChromaDB will use its default embedding function.
   * Useful as a fallback if custom embedding fails.
   */
  async queryByText(queryText: string, topK = 5) {
    const collection = await this.getCollection()

    const results = await collection.query({
      queryTexts: [queryText],
      nResults: topK
    })

    return results
  }

  /**
   * Get the total count of documents in the collection.
   */
  async getDocumentCount(): Promise<number> {
    const collection = await this.getCollection()
    return collection.count()
  }

  /**
   * Delete all documents from the collection (for re-seeding).
   */
  async clearCollection() {
    try {
      await this.client.deleteCollection({ name: this.collectionName })
      console.log(`[ChromaDB] Deleted collection "${this.collectionName}"`)
    } catch {
      console.log(`[ChromaDB] Collection "${this.collectionName}" does not exist, skipping delete`)
    }
  }
}

export const chromaService = new ChromaService()
