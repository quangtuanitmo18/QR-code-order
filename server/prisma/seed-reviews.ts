import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define ReviewStatus enum locally since it might not be exported yet
const ReviewStatus = {
  HIDDEN: 'HIDDEN',
  VISIBLE: 'VISIBLE',
  DELETED: 'DELETED'
} as const

async function seedReviews() {
  console.log('🌱 Seeding reviews...')

  // Get first guest for reviews
  const guests = await prisma.guest.findMany({ take: 5 })
  if (guests.length === 0) {
    console.log('⚠️  No guests found. Please seed guests first.')
    return
  }

  // Get an admin account for approvals/replies
  const admin = await prisma.account.findFirst({
    where: { role: 'Owner' }
  })
  if (!admin) {
    console.log('⚠️  No admin account found.')
    return
  }

  const reviewsData = [
    // VISIBLE reviews (approved)
    {
      guestId: guests[0].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Absolutely amazing experience! The food was exceptional, service was top-notch, and the ambiance was perfect for our anniversary dinner.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-10'),
      approvedBy: admin.id,
      replyContent:
        'Thank you so much for your wonderful feedback! We are thrilled to hear you enjoyed your anniversary dinner with us.',
      repliedAt: new Date('2024-11-11'),
      repliedBy: admin.id
      // images: JSON.stringify(['/uploads/review1-img1.jpg', '/uploads/review1-img2.jpg'])
    },
    {
      guestId: guests[1].id,
      overallRating: 4,
      foodQuality: 5,
      serviceQuality: 4,
      ambiance: 4,
      priceValue: 3,
      comment:
        'Great food quality and nice atmosphere. Service was good but a bit slow during peak hours. Prices are slightly high but worth it for special occasions.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-09'),
      approvedBy: admin.id
      // images: JSON.stringify(['/uploads/review2-img1.jpg'])
    },
    {
      guestId: guests[2].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 4,
      priceValue: 4,
      comment:
        'Best Vietnamese cuisine I have tried in years! The pho was authentic and the spring rolls were crispy and fresh. Highly recommended!',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-08'),
      approvedBy: admin.id,
      replyContent:
        'We appreciate your kind words! Our chef will be delighted to hear you enjoyed the authentic flavors.',
      repliedAt: new Date('2024-11-08'),
      repliedBy: admin.id
    },
    {
      guestId: guests[0].id,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 4,
      comment:
        'Wonderful dining experience with excellent service. The staff was very attentive and friendly. Food was delicious, especially the grilled dishes.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-07'),
      approvedBy: admin.id
      // images: JSON.stringify(['/uploads/review4-img1.jpg', '/uploads/review4-img2.jpg', '/uploads/review4-img3.jpg'])
    },
    {
      guestId: guests[1].id,
      overallRating: 3,
      foodQuality: 3,
      serviceQuality: 3,
      ambiance: 4,
      priceValue: 3,
      comment:
        'Decent restaurant with good ambiance. Food was okay but nothing extraordinary. Service could be improved. Good for casual dining.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-06'),
      approvedBy: admin.id,
      replyContent:
        'Thank you for your honest feedback. We are always working to improve our service and menu. Hope to serve you better next time!',
      repliedAt: new Date('2024-11-07'),
      repliedBy: admin.id
    },
    {
      guestId: guests[2].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 4,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Perfect place for family gatherings! The portions are generous, prices are reasonable, and the atmosphere is warm and welcoming.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-05'),
      approvedBy: admin.id
    },
    {
      guestId: guests[0].id,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 4,
      ambiance: 3,
      priceValue: 4,
      comment:
        'Good food and friendly staff. The restaurant was a bit noisy but overall a pleasant experience. Will come back to try other dishes.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-04'),
      approvedBy: admin.id
      // images: JSON.stringify(['/uploads/review7-img1.jpg'])
    },
    {
      guestId: guests[1].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 4,
      comment:
        'Outstanding! Every dish was perfectly prepared and beautifully presented. The service was impeccable. One of the best dining experiences.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-03'),
      approvedBy: admin.id,
      replyContent:
        'We are honored by your glowing review! Thank you for choosing us and we look forward to welcoming you again.',
      repliedAt: new Date('2024-11-03'),
      repliedBy: admin.id
      // images: JSON.stringify(['/uploads/review8-img1.jpg', '/uploads/review8-img2.jpg'])
    },
    {
      guestId: guests[2].id,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 4,
      ambiance: 4,
      priceValue: 5,
      comment:
        'Great value for money! The food quality is excellent for the price. Definitely worth visiting if you want authentic Vietnamese food without breaking the bank.',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-02'),
      approvedBy: admin.id
    },
    {
      guestId: guests[0].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 4,
      priceValue: 4,
      comment:
        'The seafood dishes are phenomenal! Fresh ingredients and skillful preparation. The grilled fish was the highlight of our meal. Highly recommend!',
      status: ReviewStatus.VISIBLE,
      approvedAt: new Date('2024-11-01'),
      approvedBy: admin.id
      // images: JSON.stringify(['/uploads/review10-img1.jpg'])
    },

    // HIDDEN reviews (pending approval)
    {
      guestId: guests[1].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Just had dinner here tonight and it was fantastic! Every dish exceeded our expectations. Cannot wait to come back and try more items from the menu.',
      status: ReviewStatus.HIDDEN
      // images: JSON.stringify(['/uploads/review11-img1.jpg', '/uploads/review11-img2.jpg'])
    },
    {
      guestId: guests[2].id,
      overallRating: 4,
      foodQuality: 5,
      serviceQuality: 4,
      ambiance: 3,
      priceValue: 4,
      comment:
        'The food is really good, especially the traditional dishes. However, the restaurant could use some renovation to improve the interior design.',
      status: ReviewStatus.HIDDEN
    },
    {
      guestId: guests[0].id,
      overallRating: 3,
      foodQuality: 3,
      serviceQuality: 4,
      ambiance: 3,
      priceValue: 3,
      comment:
        'Average experience. The service was friendly but the food was just okay. Expected more based on the reviews I read online.',
      status: ReviewStatus.HIDDEN
    },
    {
      guestId: guests[1].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 5,
      priceValue: 5,
      comment:
        'Absolutely love this place! Been here multiple times and the quality is always consistent. The staff remembers us and makes us feel like family.',
      status: ReviewStatus.HIDDEN
      // images: JSON.stringify(['/uploads/review14-img1.jpg'])
    },
    {
      guestId: guests[2].id,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 4,
      ambiance: 4,
      priceValue: 4,
      comment:
        'Solid all-around restaurant. Good food, good service, pleasant atmosphere. Perfect for both casual and business dining.',
      status: ReviewStatus.HIDDEN
    },
    {
      guestId: guests[0].id,
      overallRating: 2,
      foodQuality: 2,
      serviceQuality: 3,
      ambiance: 3,
      priceValue: 2,
      comment:
        'Disappointed with the food quality. Dishes were bland and overpriced. Service was okay but cannot compensate for the poor food. May not return.',
      status: ReviewStatus.HIDDEN
    },
    {
      guestId: guests[1].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 4,
      priceValue: 5,
      comment:
        'Hidden gem! The chef clearly knows what they are doing. Every dish we ordered was bursting with flavor. Will definitely recommend to friends.',
      status: ReviewStatus.HIDDEN
      // images: JSON.stringify(['/uploads/review17-img1.jpg', '/uploads/review17-img2.jpg', '/uploads/review17-img3.jpg'])
    },
    {
      guestId: guests[2].id,
      overallRating: 4,
      foodQuality: 4,
      serviceQuality: 5,
      ambiance: 4,
      priceValue: 4,
      comment:
        'Very impressed with the level of service. The staff went above and beyond to accommodate our dietary restrictions. Food was excellent too!',
      status: ReviewStatus.HIDDEN
    },
    {
      guestId: guests[0].id,
      overallRating: 3,
      foodQuality: 3,
      serviceQuality: 3,
      ambiance: 4,
      priceValue: 3,
      comment:
        'Nice ambiance but the food was hit or miss. Some dishes were great while others were mediocre. Inconsistent quality is concerning.',
      status: ReviewStatus.HIDDEN
    },
    {
      guestId: guests[1].id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 4,
      ambiance: 5,
      priceValue: 4,
      comment:
        'Amazing restaurant with beautiful decor and delicious food. The presentation of each dish is like a work of art. Instagram-worthy for sure!',
      status: ReviewStatus.HIDDEN
      // images: JSON.stringify(['/uploads/review20-img1.jpg', '/uploads/review20-img2.jpg'])
    },

    // DELETED reviews (spam/inappropriate)
    {
      guestId: guests[2].id,
      overallRating: 1,
      foodQuality: 1,
      serviceQuality: 1,
      ambiance: 1,
      priceValue: 1,
      comment: 'This is spam content trying to promote another restaurant. Should be deleted.',
      status: ReviewStatus.DELETED
    },
    {
      guestId: guests[0].id,
      overallRating: 1,
      foodQuality: 1,
      serviceQuality: 1,
      ambiance: 1,
      priceValue: 1,
      comment: 'Contains inappropriate language and offensive content. Deleted by admin.',
      status: ReviewStatus.DELETED
    }
  ]

  // Create reviews
  for (const reviewData of reviewsData) {
    await prisma.review.create({
      data: reviewData
    })
  }

  console.log(`✅ Created ${reviewsData.length} sample reviews`)
  console.log(`   - ${reviewsData.filter((r) => r.status === ReviewStatus.VISIBLE).length} VISIBLE`)
  console.log(`   - ${reviewsData.filter((r) => r.status === ReviewStatus.HIDDEN).length} HIDDEN (pending)`)
  console.log(`   - ${reviewsData.filter((r) => r.status === ReviewStatus.DELETED).length} DELETED`)
  console.log(`   - ${reviewsData.filter((r) => r.replyContent).length} with replies`)
}

async function main() {
  try {
    await seedReviews()
  } catch (error) {
    console.error('Error seeding reviews:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('🎉 Review seeding completed!')
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    // Use globalThis to access process in a way that avoids TypeScript errors when @types/node is not installed
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.exit) {
      ;(globalThis as any).process.exit(1)
    } else {
      // If not running in Node (or process is unavailable), rethrow to ensure the failure is visible
      throw error
    }
  })
