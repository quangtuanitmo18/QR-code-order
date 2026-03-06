import envConfig from '@/config'
import { getContextLogger } from '@/utils/logger'
import { CloudClient } from 'chromadb'

/**
 * ChromaDB Service
 * Manages vector storage and semantic search using ChromaDB Cloud.
 * Supports multiple collections: restaurant_menu, restaurant_faq
 */

export type CollectionName = 'restaurant_menu' | 'restaurant_faq'

class ChromaService {
  private client: CloudClient
  private collections: Map<string, any> = new Map()

  constructor() {
    this.client = new CloudClient({
      apiKey: envConfig.CHROMA_API_KEY,
      tenant: envConfig.CHROMA_TENANT,
      database: envConfig.CHROMA_DATABASE
    })
  }

  /**
   * Get or create a collection by name.
   */
  async getCollection(name: CollectionName = 'restaurant_menu') {
    if (!this.collections.has(name)) {
      const collection = await this.client.getOrCreateCollection({ name })
      this.collections.set(name, collection)
    }
    return this.collections.get(name)
  }

  /**
   * Upsert documents into a ChromaDB collection with their embeddings.
   */
  async upsertDocuments(
    ids: string[],
    embeddings: number[][],
    documents: string[],
    metadatas: Array<Record<string, string>>,
    collectionName: CollectionName = 'restaurant_menu'
  ) {
    const collection = await this.getCollection(collectionName)

    await collection.upsert({
      ids,
      embeddings,
      documents,
      metadatas
    })

    const log = getContextLogger()
    log?.info(`[ChromaDB] Upserted ${ids.length} documents into "${collectionName}"`)
  }

  /**
   * Semantic search — query ChromaDB with an embedding vector.
   * Returns top K most similar documents.
   */
  async queryDocuments(queryEmbedding: number[], topK = 5, collectionName: CollectionName = 'restaurant_menu') {
    const collection = await this.getCollection(collectionName)

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
  async queryByText(queryText: string, topK = 5, collectionName: CollectionName = 'restaurant_menu') {
    const collection = await this.getCollection(collectionName)

    const results = await collection.query({
      queryTexts: [queryText],
      nResults: topK
    })

    return results
  }

  /**
   * Get the total count of documents in a collection.
   */
  async getDocumentCount(collectionName: CollectionName = 'restaurant_menu'): Promise<number> {
    const collection = await this.getCollection(collectionName)
    return collection.count()
  }

  /**
   * Delete a collection (for re-seeding).
   */
  async clearCollection(collectionName: CollectionName = 'restaurant_menu') {
    try {
      await this.client.deleteCollection({ name: collectionName })
      this.collections.delete(collectionName)
      const log = getContextLogger()
      log?.info(`[ChromaDB] Deleted collection "${collectionName}"`)
    } catch {
      const log = getContextLogger()
      log?.info(`[ChromaDB] Collection "${collectionName}" does not exist, skipping delete`)
    }
  }
}

export const chromaService = new ChromaService()
