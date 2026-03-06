/**
 * Vitest global setup — runs once before all tests.
 *
 * 1. Loads .env.test (DATABASE_URL → test.db)
 * 2. Runs prisma migrate deploy to create tables in test DB
 * 3. Seeds the admin account
 */
import { execSync } from 'child_process'
import { config } from 'dotenv'
import path from 'path'

export default async function globalSetup() {
  // Load .env.test so DATABASE_URL points to test.db
  config({ path: path.resolve(__dirname, '../../.env.test'), override: true })

  console.log('\n🔧 [Test Setup] Using DATABASE_URL:', process.env.DATABASE_URL)

  // Run prisma migrations against test.db
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } as NodeJS.ProcessEnv,
      stdio: 'pipe'
    })
    console.log('✅ [Test Setup] Database schema pushed successfully')
  } catch (error: any) {
    console.error('❌ [Test Setup] Failed to push schema:', error.message)
    throw error
  }

  // Seed admin account using Prisma client
  // We dynamically import to ensure it uses the test DB
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
  })

  try {
    const bcrypt = await import('bcrypt')
    const existingAdmin = await prisma.account.findUnique({
      where: { email: 'admin@order.com' }
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('123456', 10)
      await prisma.account.create({
        data: {
          name: 'Admin',
          email: 'admin@order.com',
          password: hashedPassword,
          role: 'Owner'
        }
      })
      console.log('✅ [Test Setup] Admin account seeded')
    } else {
      console.log('ℹ️  [Test Setup] Admin account already exists')
    }
  } finally {
    await prisma.$disconnect()
  }

  console.log('🚀 [Test Setup] Ready!\n')
}
