import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBlog() {
  console.log('🌱 Seeding blog posts...')

  // Get Owner account for author
  const owner = await prisma.account.findFirst({
    where: { role: 'Owner' }
  })

  if (!owner) {
    console.log('⚠️  No Owner account found. Please create an Owner account first.')
    return
  }

  const blogPostsData = [
    {
      title: 'Welcome to Our Restaurant: A Journey Through Authentic Vietnamese Cuisine',
      slug: 'welcome-to-our-restaurant-authentic-vietnamese-cuisine',
      excerpt:
        'Discover the rich flavors and traditions of Vietnamese cuisine at our restaurant. Learn about our story, our chefs, and the authentic dishes we serve.',
      content: `# Welcome to Our Restaurant

We are thrilled to welcome you to our restaurant, where authentic Vietnamese cuisine meets exceptional dining experience. Our journey began with a simple mission: to bring the true flavors of Vietnam to your table.

## Our Story

Founded in 2020, our restaurant was born from a passion for traditional Vietnamese cooking. Our head chef, with over 20 years of experience, has carefully crafted a menu that honors the culinary traditions of Vietnam while adding modern touches.

## What Makes Us Special

### Authentic Ingredients

We source our ingredients directly from local Vietnamese markets and specialty suppliers. Every dish is prepared with fresh, high-quality ingredients that ensure authentic flavors.

### Traditional Cooking Methods

Our kitchen uses traditional Vietnamese cooking techniques passed down through generations. From slow-simmered pho broth to perfectly grilled meats, every dish tells a story.

### Warm Hospitality

At our restaurant, you're not just a customer—you're part of our family. Our staff is dedicated to providing warm, friendly service that makes every visit memorable.

## Signature Dishes

### Pho Bo (Beef Noodle Soup)

Our signature pho features a rich, aromatic broth that has been simmered for hours. Served with tender beef slices, fresh herbs, and rice noodles, it's a dish that warms the soul.

### Banh Mi

Our Vietnamese sandwich combines crispy baguette with savory fillings, fresh vegetables, and our special sauce. It's a perfect blend of French and Vietnamese culinary traditions.

### Spring Rolls

Fresh and fried spring rolls are a must-try. Made with fresh ingredients and served with our homemade dipping sauce, they're a crowd favorite.

## Visit Us Today

We invite you to experience the authentic flavors of Vietnam at our restaurant. Whether you're a longtime fan of Vietnamese cuisine or trying it for the first time, we promise an unforgettable dining experience.

**Location:** [Your Address]  
**Hours:** Monday-Sunday, 11:00 AM - 10:00 PM  
**Reservations:** Call us at [Phone Number]

Thank you for being part of our culinary journey!`,
      status: 'PUBLISHED',
      featured: true,
      category: 'Restaurant',
      tags: JSON.stringify(['Vietnamese Cuisine', 'Restaurant', 'Food', 'Culture']),
      authorId: owner.id,
      publishedAt: new Date('2024-12-01'),
      viewCount: 0
    },
    {
      title: 'The Art of Vietnamese Cooking: Techniques and Traditions',
      slug: 'art-of-vietnamese-cooking-techniques-traditions',
      excerpt:
        'Explore the traditional cooking techniques and cultural traditions that make Vietnamese cuisine unique. Learn about the balance of flavors and the philosophy behind Vietnamese cooking.',
      content: `# The Art of Vietnamese Cooking

Vietnamese cuisine is renowned for its balance of flavors, fresh ingredients, and intricate cooking techniques. In this article, we explore the traditions and methods that make Vietnamese food so special.

## The Five Fundamental Tastes

Vietnamese cooking is built on five fundamental tastes:

1. **Sweet** - From sugar, fruits, and coconut milk
2. **Sour** - From lime, tamarind, and vinegar
3. **Salty** - From fish sauce and soy sauce
4. **Bitter** - From bitter melon and certain herbs
5. **Spicy** - From chili peppers and ginger

The art lies in balancing these flavors to create harmonious dishes.

## Key Cooking Techniques

### Steaming

Steaming preserves the natural flavors and nutrients of ingredients. Dishes like steamed fish and bánh bột lọc showcase this technique beautifully.

### Grilling

Grilling over charcoal imparts a smoky flavor that's characteristic of Vietnamese street food. Our grilled pork (thịt nướng) is a perfect example.

### Stir-Frying

Quick stir-frying at high heat creates dishes with crisp vegetables and tender meats. The wok hei (breath of the wok) adds depth to the flavor.

### Braising

Slow braising tenderizes tough cuts of meat and creates rich, flavorful sauces. Our braised pork belly (thịt kho) is a comfort food favorite.

## The Importance of Fresh Herbs

No Vietnamese meal is complete without fresh herbs. Common herbs include:

- **Mint** (rau thơm) - Adds freshness
- **Cilantro** (ngò) - Provides citrusy notes
- **Thai Basil** (húng quế) - Adds anise-like flavor
- **Perilla** (tía tô) - Has a minty, cinnamon flavor

## Regional Variations

### Northern Vietnam

Northern cuisine is known for its subtle flavors and emphasis on balance. Pho originated in Hanoi and is a perfect example of this style.

### Central Vietnam

Central Vietnamese food is spicier and more complex. Dishes like bún bò Huế showcase bold flavors and vibrant colors.

### Southern Vietnam

Southern cuisine is sweeter and uses more coconut milk. Dishes are often served with fresh vegetables and herbs.

## The Philosophy of Vietnamese Cooking

Vietnamese cooking is about more than just food—it's about:

- **Balance** - Every meal should have a balance of flavors, textures, and nutrients
- **Freshness** - Using the freshest ingredients possible
- **Community** - Food brings people together
- **Respect** - Honoring traditional methods while embracing innovation

## Conclusion

The art of Vietnamese cooking is a beautiful blend of tradition, technique, and philosophy. At our restaurant, we honor these traditions while creating dishes that delight the modern palate.

Visit us to experience these techniques firsthand!`,
      status: 'PUBLISHED',
      featured: true,
      category: 'Cooking',
      tags: JSON.stringify(['Cooking', 'Vietnamese Cuisine', 'Techniques', 'Culture', 'Food']),
      authorId: owner.id,
      publishedAt: new Date('2024-12-05'),
      viewCount: 0
    },
    {
      title: 'Upcoming Menu Changes: New Dishes Coming This Month',
      slug: 'upcoming-menu-changes-new-dishes-coming',
      excerpt:
        "We're excited to announce new additions to our menu! Discover the seasonal dishes and special items we'll be introducing this month.",
      content: `# Upcoming Menu Changes

We're constantly evolving our menu to bring you the best Vietnamese cuisine. This month, we're excited to introduce several new dishes that celebrate seasonal ingredients and traditional flavors.

## New Appetizers

### Fresh Summer Rolls with Shrimp

Light and refreshing, our new summer rolls feature fresh shrimp, crisp vegetables, and herbs wrapped in rice paper. Served with our signature peanut dipping sauce.

### Crispy Tofu with Lemongrass

A vegetarian favorite, our crispy tofu is marinated in lemongrass and spices, then fried to perfection. Served with a tangy dipping sauce.

## New Main Courses

### Grilled Lemongrass Chicken

Tender chicken marinated in lemongrass, garlic, and fish sauce, then grilled to perfection. Served with jasmine rice and fresh vegetables.

### Vegetarian Pho

For our vegetarian guests, we're introducing a rich vegetable broth pho with tofu, mushrooms, and fresh herbs. It's hearty, flavorful, and completely plant-based.

### Spicy Beef Noodle Soup (Bún Bò Huế)

A Central Vietnamese specialty, this spicy beef noodle soup features a rich, aromatic broth with tender beef, pork, and fresh herbs. Perfect for those who love bold flavors.

## New Desserts

### Coconut Flan

A creamy coconut flan with a caramel sauce. Light and not too sweet, it's the perfect ending to your meal.

### Mango Sticky Rice

Sweet sticky rice topped with fresh mango and coconut cream. A classic Vietnamese dessert that's both comforting and refreshing.

## Seasonal Specials

### Spring Vegetable Stir-Fry

Made with the freshest spring vegetables, this dish celebrates the season's bounty. Light, healthy, and full of flavor.

### Summer Seafood Platter

A selection of fresh seafood including grilled shrimp, squid, and fish, served with herbs and dipping sauces. Perfect for sharing.

## Limited Time Offer

For the first two weeks of December, enjoy **20% off** on all new menu items! This is a great opportunity to try our latest creations.

## Feedback Welcome

We'd love to hear what you think about our new dishes. Your feedback helps us continue to improve and create dishes you'll love.

## Visit Us Soon

These new dishes will be available starting December 15th. We can't wait to share them with you!

**Note:** Some items may have limited availability. We recommend making a reservation to ensure you can try your favorites.

---

*Stay tuned for more menu updates and special events!*`,
      status: 'DRAFT',
      featured: false,
      category: 'Menu',
      tags: JSON.stringify(['Menu', 'New Dishes', 'Restaurant', 'Food']),
      authorId: owner.id,
      publishedAt: null,
      viewCount: 0
    }
  ]

  // Create blog posts
  for (const postData of blogPostsData) {
    const post = await prisma.blogPost.create({
      data: postData
    })
    console.log(`✅ Created blog post: ${post.title} (ID: ${post.id}, Status: ${post.status})`)
  }

  console.log(`✨ Blog seeding completed!`)
  console.log(`   - ${blogPostsData.filter((p) => p.status === 'PUBLISHED').length} PUBLISHED`)
  console.log(`   - ${blogPostsData.filter((p) => p.status === 'DRAFT').length} DRAFT`)
  console.log(`   - ${blogPostsData.filter((p) => p.featured).length} FEATURED`)
}

async function main() {
  try {
    await seedBlog()
  } catch (error) {
    console.error('❌ Error seeding blog:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('🎉 Blog seeding completed successfully!')
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.exit) {
      ;(globalThis as any).process.exit(1)
    } else {
      throw error
    }
  })
