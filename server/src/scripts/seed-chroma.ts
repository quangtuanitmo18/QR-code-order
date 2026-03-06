/**
 * Seed ChromaDB with restaurant menu data.
 *
 * Usage:
 *   npx tsx src/scripts/seed-chroma.ts
 *
 * This script:
 * 1. Fetches all available dishes from the SQLite database (Prisma)
 * 2. Builds text chunks combining dish info
 * 3. Creates embeddings via OpenRouter API
 * 4. Upserts into ChromaDB Cloud collection 'restaurant_menu'
 */

import { config } from 'dotenv'
config({ path: '.env' })

import prisma from '@/database'
import { chromaService } from '@/services/chroma.service'
import { embeddingService } from '@/services/embedding.service'

async function seedChromaDB() {
  console.log('🚀 Starting ChromaDB seeding...\n')

  // 1. Fetch all available dishes
  const dishes = await prisma.dish.findMany({
    where: { status: 'Available' }
  })
  console.log(`📦 Found ${dishes.length} available dishes in database`)

  if (dishes.length === 0) {
    console.log('⚠️  No dishes found. Add some dishes first.')
    return
  }

  // 2. Build text chunks for each dish
  const documents = dishes.map((d) => {
    const parts = [
      d.name,
      `Category: ${d.category}`,
      d.description,
      d.ingredients ? `Ingredients: ${d.ingredients}` : '',
      d.allergens ? `Allergens: ${d.allergens}` : '',
      d.tags ? `Tags: ${d.tags}` : '',
      `Price: ${d.price}`
    ].filter(Boolean)

    return parts.join(' - ')
  })

  console.log(`📝 Built ${documents.length} text chunks`)
  console.log(`   Example: "${documents[0]?.substring(0, 100)}..."`)

  // 3. Create embeddings (batch for efficiency)
  console.log('\n🧠 Creating embeddings via OpenRouter...')
  const batchSize = 20 // OpenRouter can handle batches
  const allEmbeddings: number[][] = []

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    console.log(
      `   Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}: ${batch.length} items`
    )

    const embeddings = await embeddingService.createEmbeddings(batch)
    allEmbeddings.push(...embeddings)
  }

  console.log(`✅ Created ${allEmbeddings.length} embeddings`)

  // 4. Prepare metadata
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

  // 5. Clear existing data and upsert
  console.log('\n📤 Upserting into ChromaDB Cloud...')
  await chromaService.upsertDocuments(ids, allEmbeddings, documents, metadatas)

  // 6. Verify
  const count = await chromaService.getDocumentCount()
  console.log(`\n✅ ChromaDB seeding complete! Total documents: ${count}`)

  // 7. Quick test query
  console.log('\n🔍 Running test query: "something light and refreshing"...')
  const testEmbedding = await embeddingService.createQueryEmbedding('something light and refreshing')
  const testResults = await chromaService.queryDocuments(testEmbedding, 3)
  console.log('   Results:')
  testResults.documents?.[0]?.forEach((doc: string | null, i: number) => {
    console.log(`   ${i + 1}. ${doc?.substring(0, 80)}...`)
    console.log(`      Distance: ${testResults.distances?.[0]?.[i]}`)
  })

  await prisma.$disconnect()
  console.log('\n🎉 Done!')
}

seedChromaDB().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
