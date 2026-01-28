import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

declare const process: { exit(code?: number): never }

async function seedGuests() {
  console.log('🌱 Seeding guests...')

  const guestsData = [
    {
      name: 'Nguyen Van An'
    },
    {
      name: 'Tran Thi Binh'
    },
    {
      name: 'Le Hoang Cuong'
    }
  ]

  for (const guestData of guestsData) {
    const guest = await prisma.guest.create({
      data: guestData
    })
    console.log(`✅ Created guest: ${guest.name} (ID: ${guest.id})`)
  }

  console.log('✨ Guest seeding completed!')
}

seedGuests()
  .catch((e) => {
    console.error('❌ Error seeding guests:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
