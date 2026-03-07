/**
 * Seed ChromaDB with restaurant menu data + FAQ data.
 *
 * Usage:
 *   npx tsx src/scripts/seed-chroma.ts
 *
 * This script:
 * 1. Seeds 'restaurant_menu' collection with dish data
 * 2. Seeds 'restaurant_faq' collection with FAQ data
 * 3. Creates embeddings via OpenRouter API
 * 4. Runs test queries to verify both collections
 */

import { config } from 'dotenv'
config({ path: '.env' })

import prisma from '@/database'
import { chromaService, type CollectionName } from '@/services/chroma.service'
import { embeddingService } from '@/services/embedding.service'

/**
 * Helper: create embeddings in batches and upsert into a collection.
 */
async function seedCollection(
  collectionName: CollectionName,
  ids: string[],
  documents: string[],
  metadatas: Array<Record<string, string>>
) {
  const batchSize = 20
  const allEmbeddings: number[][] = []

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    console.log(
      `   Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}: ${batch.length} items`
    )
    const embeddings = await embeddingService.createEmbeddings(batch)
    allEmbeddings.push(...embeddings)
  }

  console.log(`   ✅ Created ${allEmbeddings.length} embeddings`)

  // Clear and upsert
  await chromaService.clearCollection(collectionName)
  await chromaService.upsertDocuments(ids, allEmbeddings, documents, metadatas, collectionName)

  const count = await chromaService.getDocumentCount(collectionName)
  console.log(`   ✅ Collection "${collectionName}" now has ${count} documents\n`)
}

// ─── SEED DISHES ────────────────────────────────────────────

async function seedDishes() {
  console.log('═══════════════════════════════════════')
  console.log('  🍽️  Seeding restaurant_menu collection')
  console.log('═══════════════════════════════════════\n')

  const dishes = await prisma.dish.findMany({
    where: { status: 'Available' }
  })
  console.log(`📦 Found ${dishes.length} available dishes`)

  if (dishes.length === 0) {
    console.log('⚠️  No dishes found. Run prisma db seed first.\n')
    return
  }

  // Build text chunks
  const documents = dishes.map((d) => {
    const parts = [
      d.name,
      `Category: ${d.category}`,
      d.description,
      d.ingredients ? `Ingredients: ${d.ingredients}` : '',
      d.allergens && d.allergens !== 'None' ? `Allergens: ${d.allergens}` : '',
      d.tags ? `Tags: ${d.tags}` : '',
      `Price: $${d.price}`
    ].filter(Boolean)
    return parts.join(' — ')
  })

  const ids = dishes.map((d) => `dish-${d.id}`)
  const metadatas = dishes.map((d) => ({
    name: d.name,
    category: d.category,
    price: String(d.price),
    dishId: String(d.id),
    ingredients: d.ingredients || '',
    allergens: d.allergens || '',
    tags: d.tags || ''
  }))

  console.log(`📝 Built ${documents.length} text chunks`)
  console.log(`   Example: "${documents[0]?.substring(0, 100)}..."`)
  console.log('\n🧠 Creating embeddings...')

  await seedCollection('restaurant_menu', ids, documents, metadatas)
}

// ─── SEED FAQs ──────────────────────────────────────────────

async function seedFAQs() {
  console.log('═══════════════════════════════════════')
  console.log('  ❓  Seeding restaurant_faq collection')
  console.log('═══════════════════════════════════════\n')

  const faqs = await prisma.fAQ.findMany({
    orderBy: { sortOrder: 'asc' }
  })
  console.log(`📦 Found ${faqs.length} FAQs`)

  if (faqs.length === 0) {
    console.log('⚠️  No FAQs found. Run prisma db seed first.\n')
    return
  }

  // Build text chunks: combine question + answer for semantic matching
  const documents = faqs.map((faq) => {
    const parts = [
      `Question: ${faq.question}`,
      `Answer: ${faq.answer}`,
      faq.category ? `Category: ${faq.category}` : ''
    ].filter(Boolean)
    return parts.join(' — ')
  })

  const ids = faqs.map((faq) => `faq-${faq.id}`)
  const metadatas = faqs.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
    category: faq.category || '',
    faqId: String(faq.id)
  }))

  console.log(`📝 Built ${documents.length} text chunks`)
  console.log(`   Example: "${documents[0]?.substring(0, 120)}..."`)
  console.log('\n🧠 Creating embeddings...')

  await seedCollection('restaurant_faq', ids, documents, metadatas)
}

// ─── TEST QUERIES ───────────────────────────────────────────

async function runTestQueries() {
  console.log('═══════════════════════════════════════')
  console.log('  🔍  Running test queries')
  console.log('═══════════════════════════════════════\n')

  // Test menu search
  console.log('🍽️  Menu query: "something light and refreshing"')
  const menuEmbedding = await embeddingService.createQueryEmbedding('something light and refreshing')
  const menuResults = await chromaService.queryDocuments(menuEmbedding, 3, 'restaurant_menu')
  menuResults.documents?.[0]?.forEach((doc: string | null, i: number) => {
    console.log(`   ${i + 1}. ${doc?.substring(0, 80)}...`)
    console.log(`      Distance: ${menuResults.distances?.[0]?.[i]}`)
  })

  console.log('')

  // Test FAQ search
  console.log('❓  FAQ query: "do you allow pets inside?"')
  const faqEmbedding = await embeddingService.createQueryEmbedding('do you allow pets inside?')
  const faqResults = await chromaService.queryDocuments(faqEmbedding, 3, 'restaurant_faq')
  faqResults.documents?.[0]?.forEach((doc: string | null, i: number) => {
    console.log(`   ${i + 1}. ${doc?.substring(0, 100)}...`)
    console.log(`      Distance: ${faqResults.distances?.[0]?.[i]}`)
  })
}

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting ChromaDB seeding...\n')

  await seedDishes()
  await seedFAQs()
  await runTestQueries()

  await prisma.$disconnect()
  console.log('\n🎉 All done!')
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
