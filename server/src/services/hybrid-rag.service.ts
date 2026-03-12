/**
 * Hybrid RAG Search Service — 5-Layer Production Pipeline
 *
 * Pipeline: Normalize → Entity Extract → Expand → Hybrid Retrieve → Rerank + Log
 *
 * Provides both:
 * - Full menu search (5-layer, 3-way retrieval)
 * - Lightweight FAQ search (4-layer, 2-way retrieval)
 */

import prisma from '@/database'
import {
  tasteDictionary,
  ingredientDictionary,
  allergenPhrases,
  allergenExclusionPatterns
} from '@/data/entity-dictionaries'
import { chromaService, type CollectionName } from '@/services/chroma.service'
import { embeddingService } from '@/services/embedding.service'
import { getContextLogger } from '@/utils/logger'
import synonymsData from '@/data/synonyms.json'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NormalizedQuery {
  text: string
  language: 'vi' | 'en' | 'ru' | 'unknown'
  original: string
}

export interface ExtractedQuery {
  category?: string
  ingredient?: string
  taste?: string
  allergenExclusion?: string
  isShort: boolean
  hasCatalogCategory: boolean
  shouldUseSynonyms: boolean
  shouldUseCatalog: boolean
  shouldUseFilter: boolean
}

export interface ExpandedQuery {
  text: string
  weight: number
  source: 'original' | 'synonym' | 'catalog'
}

export interface HybridSearchResult {
  id: number
  name: string
  price: number
  description: string
  category: string
  ingredients: string
  allergens: string
  tags: string
  score: number
  source: 'sql' | 'vector' | 'filter' | 'both'
}

// ─── Constants ──────────────────────────────────────────────────────────────

const WEIGHTS = {
  ORIGINAL: 1.0,
  SYNONYM: 0.8,
  CATALOG: 0.7
} as const

const SCORES = {
  SQL_EXACT_NAME: 100,
  FILTER_MATCH: 80,
  SQL_PARTIAL: 70,
  VECTOR_MULTIPLIER: 60,
  MULTI_SOURCE_BONUS: 0.5
} as const

const MAX_EXPANSIONS = 8
const MAX_CATALOG_EXPANSIONS = 5

// ─── Category Cache ─────────────────────────────────────────────────────────
// Loaded once on server startup via hybridRagService.init().
// Safe from race conditions because init() completes before the server starts listening.

let cachedCategories: string[] = []

async function loadCategories(): Promise<void> {
  try {
    const categories = await prisma.dishCategory.findMany({ select: { name: true } })
    cachedCategories = categories.map((c) => c.name.toLowerCase())
    getContextLogger()?.info(`[Hybrid RAG] Cached ${cachedCategories.length} dish categories`)
  } catch {
    getContextLogger()?.warn('[Hybrid RAG] Failed to cache categories, entity extraction will be limited')
  }
}

// ─── Layer 1: Normalize ─────────────────────────────────────────────────────

function detectLanguage(text: string): NormalizedQuery['language'] {
  // Simple heuristic: check for Vietnamese diacritics vs Cyrillic vs default English.
  // Intentionally runs on the raw (un-lowercased) input so diacritics and case are preserved for detection.
  const viPattern = /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i
  const ruPattern = /[а-яА-ЯёЁ]/
  if (viPattern.test(text)) return 'vi'
  if (ruPattern.test(text)) return 'ru'
  const asciiLetters = text.replace(/[^a-zA-Z]/g, '')
  if (asciiLetters.length > text.replace(/\s/g, '').length * 0.5) return 'en'
  return 'unknown'
}

export function normalizeQuery(raw: string): NormalizedQuery {
  const text = raw.trim().toLowerCase().normalize('NFC')
  return {
    text,
    language: detectLanguage(raw), // raw preserves diacritics for accurate detection
    original: raw
  }
}

// ─── Layer 2: Entity Extraction ─────────────────────────────────────────────

export function extractEntities(normalized: NormalizedQuery): ExtractedQuery {
  const text = normalized.text
  const words = text.split(/\s+/)

  // Match category from cached DB categories
  const category = cachedCategories.find((c) => text.includes(c))

  // Match taste from dictionary
  const taste = tasteDictionary.find((t) => text.includes(t.toLowerCase()))

  // Match ingredient from dictionary
  const ingredient = ingredientDictionary.find((i) => text.includes(i.toLowerCase()))

  // Match allergen exclusion: look for "không X", "no X", etc.
  // Trim patterns and normalize whitespace to handle double-space edge cases.
  let allergenExclusion: string | undefined
  for (const pattern of allergenExclusionPatterns) {
    const trimmedPattern = pattern.trim().toLowerCase()
    if (text.includes(trimmedPattern)) {
      const afterPattern = text.slice(text.indexOf(trimmedPattern) + trimmedPattern.length).trim()
      const matchedAllergen = allergenPhrases.find((a) => afterPattern.startsWith(a.toLowerCase()))
      if (matchedAllergen) {
        allergenExclusion = matchedAllergen
        break
      }
    }
  }

  return {
    category: category || undefined,
    ingredient: ingredient || undefined,
    taste: taste || undefined,
    allergenExclusion: allergenExclusion || undefined,
    isShort: words.length <= 3,
    hasCatalogCategory: !!category,
    shouldUseSynonyms: true,
    shouldUseCatalog: !!category,
    shouldUseFilter: !!(category || ingredient || taste || allergenExclusion)
  }
}

// ─── Layer 3: Query Expansion ───────────────────────────────────────────────

const synonymMap: Record<string, string[]> = synonymsData

function expandBySynonyms(query: string): ExpandedQuery[] {
  const results: ExpandedQuery[] = []

  // Direct lookup
  const directMatch = synonymMap[query]
  if (directMatch) {
    results.push(
      ...directMatch.map((text) => ({
        text,
        weight: WEIGHTS.SYNONYM,
        source: 'synonym' as const
      }))
    )
  }

  // Partial match — check if query contains a synonym key
  for (const [key, values] of Object.entries(synonymMap)) {
    if (key !== query && query.includes(key)) {
      results.push(
        ...values.slice(0, 2).map((text) => ({
          text,
          weight: WEIGHTS.SYNONYM,
          source: 'synonym' as const
        }))
      )
    }
  }

  // Reverse lookup — check if query matches a synonym value
  for (const [key, values] of Object.entries(synonymMap)) {
    if (values.some((v) => v.toLowerCase() === query)) {
      results.push({
        text: key,
        weight: WEIGHTS.SYNONYM,
        source: 'synonym' as const
      })
    }
  }

  return results
}

async function expandByCatalog(query: string): Promise<ExpandedQuery[]> {
  try {
    const matchingCategories = await prisma.dishCategory.findMany({
      where: { name: { contains: query } }
    })

    if (matchingCategories.length > 0) {
      const dishes = await prisma.dish.findMany({
        where: { category: matchingCategories[0].name, status: 'Available' },
        select: { name: true },
        take: MAX_CATALOG_EXPANSIONS
      })
      return dishes.map((d) => ({
        text: d.name.toLowerCase(),
        weight: WEIGHTS.CATALOG,
        source: 'catalog' as const
      }))
    }
  } catch {
    getContextLogger()?.warn('[Hybrid RAG] Catalog expansion failed, skipping')
  }
  return []
}

function dedupeAndTrim(expansions: ExpandedQuery[], max: number): ExpandedQuery[] {
  const seen = new Set<string>()
  const result: ExpandedQuery[] = []

  for (const exp of expansions) {
    const key = exp.text.toLowerCase().trim()
    if (!seen.has(key) && key.length > 0) {
      seen.add(key)
      result.push(exp)
    }
    if (result.length >= max) break
  }
  return result
}

async function buildExpandedQueries(normalized: NormalizedQuery, entities: ExtractedQuery): Promise<ExpandedQuery[]> {
  const results: ExpandedQuery[] = [{ text: normalized.text, weight: WEIGHTS.ORIGINAL, source: 'original' }]

  if (entities.shouldUseSynonyms) {
    results.push(...expandBySynonyms(normalized.text))
  }

  if (entities.shouldUseCatalog) {
    results.push(...(await expandByCatalog(normalized.text)))
  }

  return dedupeAndTrim(results, MAX_EXPANSIONS)
}

// ─── Layer 4: Hybrid Retrieval ──────────────────────────────────────────────

interface DishResult {
  id: number
  name: string
  price: number
  description: string
  category: string
  ingredients: string | null
  allergens: string | null
  tags: string | null
}

async function sqlSearchWithExpansion(expansions: ExpandedQuery[], take = 10): Promise<DishResult[]> {
  const terms = expansions.map((e) => e.text)
  return prisma.dish.findMany({
    where: {
      OR: terms.flatMap((term) => [
        { name: { contains: term } },
        { category: { contains: term } },
        { tags: { contains: term } }
      ]),
      status: 'Available'
    },
    take
  })
}

async function structuredFilter(entities: ExtractedQuery, take = 10): Promise<DishResult[]> {
  if (!entities.shouldUseFilter) return []

  const where: Record<string, unknown> = { status: 'Available' }
  if (entities.category) where.category = { contains: entities.category }
  if (entities.ingredient) where.ingredients = { contains: entities.ingredient }
  if (entities.taste) where.tags = { contains: entities.taste }
  // Note: SQLite doesn't support NOT CONTAINS natively. We filter in-memory for allergen exclusion.

  const dishes = await prisma.dish.findMany({ where, take: take * 2 })

  // In-memory allergen exclusion
  if (entities.allergenExclusion) {
    const exclusion = entities.allergenExclusion.toLowerCase()
    return dishes.filter((d) => !d.allergens?.toLowerCase().includes(exclusion)).slice(0, take)
  }

  return dishes.slice(0, take)
}

interface VectorResult {
  text: string | null
  metadata: Record<string, unknown>
  distance: number | null
  dishId?: number
}

async function vectorSearch(query: NormalizedQuery, topK = 5): Promise<VectorResult[]> {
  const queryEmbedding = await embeddingService.createQueryEmbedding(query.text)
  const results = await chromaService.queryDocuments(queryEmbedding, topK, 'restaurant_menu')

  if (!results.documents?.[0]?.length) return []

  return results.documents[0].map((doc: string | null, i: number) => {
    const meta = (results.metadatas?.[0]?.[i] as Record<string, unknown>) || {}
    const rawId = Number(meta?.dishId)
    return {
      text: doc,
      metadata: meta,
      distance: results.distances?.[0]?.[i] ?? null,
      dishId: Number.isFinite(rawId) && rawId > 0 ? rawId : undefined
    }
  })
}

// ─── Layer 5: Merge + Rerank + Log ──────────────────────────────────────────

function toDishFields(dish: DishResult): Omit<HybridSearchResult, 'score' | 'source'> {
  return {
    id: dish.id,
    name: dish.name,
    price: dish.price,
    description: dish.description,
    category: dish.category,
    ingredients: dish.ingredients || 'Not specified',
    allergens: dish.allergens || 'None',
    tags: dish.tags || 'None'
  }
}

function rerankResults(
  sqlResults: DishResult[],
  vectorResults: VectorResult[],
  filterResults: DishResult[],
  originalQuery: string,
  expansions: ExpandedQuery[]
): HybridSearchResult[] {
  const scoreMap = new Map<number, HybridSearchResult>()
  const lowerQuery = originalQuery.toLowerCase()

  // Score SQL results
  for (const dish of sqlResults) {
    const isExactName = dish.name.toLowerCase().includes(lowerQuery)
    const baseScore = isExactName ? SCORES.SQL_EXACT_NAME : SCORES.SQL_PARTIAL

    // Find which expansion matched this dish to get its weight
    const matchedExpansion = expansions.find(
      (e) =>
        dish.name.toLowerCase().includes(e.text) ||
        dish.category.toLowerCase().includes(e.text) ||
        (dish.tags?.toLowerCase().includes(e.text) ?? false)
    )
    const weight = matchedExpansion?.weight ?? WEIGHTS.ORIGINAL
    const score = baseScore * weight

    scoreMap.set(dish.id, { ...toDishFields(dish), score, source: 'sql' })
  }

  // Score structured filter results
  for (const dish of filterResults) {
    const existing = scoreMap.get(dish.id)
    if (existing) {
      existing.score += SCORES.FILTER_MATCH * SCORES.MULTI_SOURCE_BONUS
      existing.source = 'both'
    } else {
      scoreMap.set(dish.id, { ...toDishFields(dish), score: SCORES.FILTER_MATCH, source: 'filter' })
    }
  }

  // Score vector results
  for (const vec of vectorResults) {
    const vectorScore = (1 - (vec.distance ?? 1)) * SCORES.VECTOR_MULTIPLIER
    const dishId = vec.dishId
    if (!dishId) continue

    const existing = scoreMap.get(dishId)
    if (existing) {
      existing.score += vectorScore * SCORES.MULTI_SOURCE_BONUS
      existing.source = 'both'
    } else {
      // Try to fetch dish details for vector-only results
      scoreMap.set(dishId, {
        id: dishId,
        name: String(vec.metadata?.name || vec.text || 'Unknown'),
        price: Number(vec.metadata?.price || 0),
        description: String(vec.metadata?.description || ''),
        category: String(vec.metadata?.category || ''),
        ingredients: String(vec.metadata?.ingredients || 'Not specified'),
        allergens: String(vec.metadata?.allergens || 'None'),
        tags: String(vec.metadata?.tags || 'None'),
        score: vectorScore,
        source: 'vector'
      })
    }
  }

  return [...scoreMap.values()].sort((a, b) => b.score - a.score)
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Full menu search — 5-layer pipeline with 3-way retrieval.
 */
async function searchMenu(rawQuery: string): Promise<HybridSearchResult[]> {
  const log = getContextLogger()
  const startTime = Date.now()

  // Edge case handling
  if (!rawQuery || rawQuery.trim().length === 0) return []
  const query = rawQuery.length > 200 ? rawQuery.slice(0, 200) : rawQuery

  // Layer 1: Normalize
  const normalized = normalizeQuery(query)

  // Layer 2: Entity Extraction
  const entities = extractEntities(normalized)

  // Layer 3: Query Expansion
  const expansions = await buildExpandedQueries(normalized, entities)

  // Layer 4: 3-way Hybrid Retrieval
  const [sqlResult, vectorResult, filterResult] = await Promise.allSettled([
    sqlSearchWithExpansion(expansions, 10),
    vectorSearch(normalized, 5),
    structuredFilter(entities, 10)
  ])

  const sqlResults = sqlResult.status === 'fulfilled' ? sqlResult.value : []
  const vectorResults = vectorResult.status === 'fulfilled' ? vectorResult.value : []
  const filterResults = filterResult.status === 'fulfilled' ? filterResult.value : []

  if (sqlResult.status === 'rejected') {
    log?.warn({ err: sqlResult.reason }, '[Hybrid RAG] SQL search failed, continuing with other sources')
  }
  if (vectorResult.status === 'rejected') {
    log?.warn({ err: vectorResult.reason }, '[Hybrid RAG] Vector search failed, continuing with other sources')
  }
  if (filterResult.status === 'rejected') {
    log?.warn({ err: filterResult.reason }, '[Hybrid RAG] Structured filter failed, continuing with other sources')
  }

  // Layer 5: Merge + Rerank + Log
  const reranked = rerankResults(sqlResults, vectorResults, filterResults, normalized.text, expansions)

  log?.info(
    {
      query_original: normalized.original,
      query_normalized: normalized.text,
      language: normalized.language,
      entities: {
        category: entities.category,
        ingredient: entities.ingredient,
        taste: entities.taste,
        allergenExclusion: entities.allergenExclusion
      },
      expansions: expansions.map((e) => ({ text: e.text, weight: e.weight, source: e.source })),
      retrieval_mode: 'hybrid',
      sql_count: sqlResults.length,
      vector_count: vectorResults.length,
      filter_count: filterResults.length,
      final_count: reranked.length,
      top_result: reranked[0]?.name,
      latency_ms: Date.now() - startTime
    },
    '[Hybrid RAG] Menu search completed'
  )

  return reranked
}

/**
 * Lightweight FAQ search — 4-layer pipeline with 2-way retrieval.
 */
async function searchFAQ(rawQuery: string) {
  const log = getContextLogger()
  const startTime = Date.now()

  if (!rawQuery || rawQuery.trim().length === 0) return []
  const query = rawQuery.length > 200 ? rawQuery.slice(0, 200) : rawQuery

  // Layer 1: Normalize
  const normalized = normalizeQuery(query)

  // Layer 2: Light expansion (synonym only if short)
  const expansions: ExpandedQuery[] = [{ text: normalized.text, weight: WEIGHTS.ORIGINAL, source: 'original' }]
  if (normalized.text.split(/\s+/).length <= 3) {
    expansions.push(...expandBySynonyms(normalized.text))
  }
  const trimmedExpansions = dedupeAndTrim(expansions, MAX_EXPANSIONS)

  // Layer 3: 2-way retrieval
  const [sqlResult, vectorResult] = await Promise.allSettled([
    prisma.fAQ.findMany({
      where: {
        OR: trimmedExpansions.flatMap((e) => [{ question: { contains: e.text } }, { answer: { contains: e.text } }]),
        isActive: true
      },
      take: 5
    }),
    (async () => {
      const embedding = await embeddingService.createQueryEmbedding(normalized.text)
      return chromaService.queryDocuments(embedding, 5, 'restaurant_faq' as CollectionName)
    })()
  ])

  const sqlResults = sqlResult.status === 'fulfilled' ? sqlResult.value : []
  const vectorResults =
    vectorResult.status === 'fulfilled' && vectorResult.value.documents?.[0]
      ? vectorResult.value.documents[0].map((doc: string | null, i: number) => ({
          text: doc,
          metadata: vectorResult.value.metadatas?.[0]?.[i] || {},
          distance: vectorResult.value.distances?.[0]?.[i] ?? null
        }))
      : []

  // Layer 4: Simple rerank
  const scoreMap = new Map<
    number,
    { id: number; question: string; answer: string; category: string; score: number; source: string }
  >()

  for (const faq of sqlResults) {
    const isExactQuestion = faq.question.toLowerCase().includes(normalized.text)
    const score = isExactQuestion ? 100 : 70
    scoreMap.set(faq.id, {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      score,
      source: 'sql'
    })
  }

  for (const vec of vectorResults) {
    const vectorScore = (1 - ((vec as { distance: number | null }).distance ?? 1)) * 60
    const faqId = Number((vec as { metadata: Record<string, unknown> }).metadata?.faqId)
    if (!faqId) continue

    const existing = scoreMap.get(faqId)
    if (existing) {
      existing.score += 30 // bonus for both sources
      existing.source = 'both'
    } else {
      scoreMap.set(faqId, {
        id: faqId,
        question: String((vec as { metadata: Record<string, unknown> }).metadata?.question || ''),
        answer: String((vec as { text: string | null }).text || ''),
        category: String((vec as { metadata: Record<string, unknown> }).metadata?.category || ''),
        score: vectorScore,
        source: 'vector'
      })
    }
  }

  const results = [...scoreMap.values()].sort((a, b) => b.score - a.score)

  log?.info(
    {
      query_original: normalized.original,
      query_normalized: normalized.text,
      retrieval_mode: 'faq_hybrid_light',
      sql_count: sqlResults.length,
      vector_count: vectorResults.length,
      final_count: results.length,
      top_result: results[0]?.question,
      latency_ms: Date.now() - startTime
    },
    '[Hybrid RAG] FAQ search completed'
  )

  return results
}

// ─── Service Export ─────────────────────────────────────────────────────────

export const hybridRagService = {
  /** Initialize category cache. Call once on server startup. */
  init: loadCategories,

  /** Full 5-layer menu search with 3-way retrieval */
  searchMenu,

  /** Lightweight 4-layer FAQ search with 2-way retrieval */
  searchFAQ,

  // Exposed for testing
  _internal: {
    normalizeQuery,
    extractEntities,
    expandBySynonyms,
    buildExpandedQueries,
    dedupeAndTrim
  }
}
