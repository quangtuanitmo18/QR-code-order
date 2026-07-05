import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const daysFromNow = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}
const hoursFromNow = (h: number) => {
  const d = new Date()
  d.setHours(d.getHours() + h)
  return d
}

async function main() {
  console.log('\u{1F680} Starting Big Boy Restaurant \u2014 Production Seed...\n')

  // ===========================================================
  // 1. CLEAR ALL DATA
  // ===========================================================
  console.log('\u{1F5D1}\uFE0F  Clearing existing data...')

  await prisma.messageReadReceipt.deleteMany()
  await prisma.messageReaction.deleteMany()
  await prisma.messageAttachment.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationPin.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.conversation.deleteMany()

  await prisma.taskAttachment.deleteMany()
  await prisma.taskComment.deleteMany()
  await prisma.task.deleteMany()

  await prisma.calendarNotification.deleteMany()
  await prisma.calendarEventAssignment.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.calendarType.deleteMany()

  await prisma.employeeSpin.deleteMany()
  await prisma.spinReward.deleteMany()
  await prisma.spinEvent.deleteMany()

  await prisma.blogPost.deleteMany()

  await prisma.couponUsage.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.payment.deleteMany()

  await prisma.coupon.deleteMany()
  await prisma.review.deleteMany()
  await prisma.fcmToken.deleteMany()
  await prisma.aiChatSession.deleteMany()
  await prisma.executionTrace.deleteMany()
  await prisma.socket.deleteMany()
  await prisma.refreshToken.deleteMany()

  await prisma.dishSnapshot.deleteMany()
  await prisma.dish.deleteMany()
  await prisma.dishCategory.deleteMany()

  await prisma.guest.deleteMany()
  await prisma.table.deleteMany()

  await prisma.account.deleteMany()

  await prisma.restaurantSetting.deleteMany()
  await prisma.fAQ.deleteMany()

  console.log('\u2705 All tables cleared.\n')

  // ===========================================================
  // 2. ACCOUNTS
  // ===========================================================
  console.log('\u{1F465} Creating accounts...')
  const hashedOwner = await bcrypt.hash('123456', 10)
  const hashedEmp = await bcrypt.hash('emp123', 10)

  const owner = await prisma.account.create({
    data: {
      name: 'Admin Owner',
      email: 'admin@order.com',
      password: hashedOwner,
      role: 'Owner',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
    }
  })

  const emp1 = await prisma.account.create({
    data: {
      name: 'Nguy\u1ec5n Th\u1ecb Mai',
      email: 'mai@bigboy.vn',
      password: hashedEmp,
      role: 'Employee',
      ownerId: owner.id,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80'
    }
  })

  const emp2 = await prisma.account.create({
    data: {
      name: 'Tr\u1ea7n V\u0103n H\u00f9ng',
      email: 'hung@bigboy.vn',
      password: hashedEmp,
      role: 'Employee',
      ownerId: owner.id,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80'
    }
  })

  const emp3 = await prisma.account.create({
    data: {
      name: 'L\u00ea Th\u1ecb Hoa',
      email: 'hoa@bigboy.vn',
      password: hashedEmp,
      role: 'Employee',
      ownerId: owner.id,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'
    }
  })

  console.log('\u2705 4 accounts created (1 Owner + 3 Employees)\n')

  // ===========================================================
  // 3. DISH CATEGORIES
  // ===========================================================
  console.log('\u{1F3F7}\uFE0F  Creating dish categories...')
  const catData = [
    { name: 'Khai V\u1ecb / Appetizers', description: 'C\u00e1c m\u00f3n khai v\u1ecb truy\u1ec1n th\u1ed1ng v\u00e0 \u0111\u1eb7c s\u1eafc c\u1ee7a nh\u00e0 h\u00e0ng' },
    { name: 'Ph\u1edf & B\u00fan / Noodle Soups', description: 'Ph\u1edf b\u00f2, b\u00fan b\u00f2 Hu\u1ebf, b\u00fan ch\u1ea3 v\u00e0 c\u00e1c m\u00f3n s\u00fap \u0111\u1eb7c tr\u01b0ng' },
    { name: 'C\u01a1m / Rice Dishes', description: 'C\u01a1m t\u1ea5m, c\u01a1m g\u00e0, c\u01a1m chi\u00ean \u0111a d\u1ea1ng v\u00e0 phong ph\u00fa' },
    { name: 'H\u1ea3i S\u1ea3n / Seafood', description: 'H\u1ea3i s\u1ea3n t\u01b0\u01a1i s\u1ed1ng: t\u00f4m, cua, c\u00e1, m\u1ef1c \u0111\u01b0\u1ee3c ch\u1ebf bi\u1ebfn \u0111\u1eb7c s\u1eafc' },
    { name: 'M\u00f3n N\u01b0\u1edbng / Grilled', description: 'C\u00e1c m\u00f3n n\u01b0\u1edbng th\u01a1m ngon: b\u00f2, heo, g\u00e0 tr\u00ean than hoa' },
    { name: 'Tr\u00e1ng Mi\u1ec7ng / Desserts', description: 'Ch\u00e8, b\u00e1nh flan, kem v\u00e0 hoa qu\u1ea3 nhi\u1ec7t \u0111\u1edbi t\u01b0\u01a1i m\u00e1t' },
    { name: '\u0110\u1ed3 U\u1ed1ng / Beverages', description: 'C\u00e0 ph\u00ea Vi\u1ec7t, tr\u00e0 sen, sinh t\u1ed1, bia v\u00e0 r\u01b0\u1ee3u vang' }
  ]
  for (const c of catData) {
    await prisma.dishCategory.create({ data: c })
  }
  console.log('\u2705 7 dish categories created\n')

  // ===========================================================
  // 4. DISHES + DISH SNAPSHOTS
  // ===========================================================
  console.log('\u{1F37D}\uFE0F  Creating dishes and snapshots...')

  const dishData = [
    // APPETIZERS
    {
      name: 'G\u1ecfi Cu\u1ed1n T\u00f4m Th\u1ecbt',
      price: 4,
      description: 'Fresh rice paper rolls stuffed with tiger prawns, pork belly, rice vermicelli, lettuce and fresh herbs. Served with house peanut-hoisin dipping sauce.',
      image: 'https://images.unsplash.com/photo-1562802378-063ec186a863?auto=format&fit=crop&w=600&q=80',
      category: 'Khai V\u1ecb / Appetizers',
      status: 'Available',
      ingredients: 'Rice paper, tiger prawns, pork belly, rice vermicelli, lettuce, mint, cilantro, bean sprouts',
      allergens: 'Seafood, Peanuts',
      tags: 'Vietnamese, Fresh, Light, Best Seller'
    },
    {
      name: 'Ch\u1ea3 Gi\u00f2 (Nem R\u00e1n)',
      price: 5,
      description: 'Crispy deep-fried spring rolls filled with seasoned pork, wood ear mushrooms, glass noodles and carrots. Served with sweet fish sauce and pickled vegetables.',
      image: 'https://images.unsplash.com/photo-1669271071060-e8ac0f15b7f9?auto=format&fit=crop&w=600&q=80',
      category: 'Khai V\u1ecb / Appetizers',
      status: 'Available',
      ingredients: 'Pork mince, wood ear mushrooms, glass noodles, carrot, taro, egg, rice paper',
      allergens: 'Gluten, Egg',
      tags: 'Fried, Traditional, Appetizer'
    },
    {
      name: 'B\u00e1nh X\u00e8o (Vietnamese Sizzling Crepe)',
      price: 7,
      description: 'Golden crispy rice flour crepe made with turmeric, filled with pork belly, shrimp, bean sprouts and scallions. Wrapped in lettuce with fresh herbs.',
      image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=600&q=80',
      category: 'Khai V\u1ecb / Appetizers',
      status: 'Available',
      ingredients: 'Rice flour, turmeric, pork belly, shrimp, bean sprouts, coconut milk, scallions',
      allergens: 'Seafood, Gluten',
      tags: 'Crispy, Southern Vietnam, Signature'
    },
    {
      name: 'G\u1ecfi Xo\u00e0i T\u00f4m (Mango Shrimp Salad)',
      price: 7,
      description: 'Vibrant salad of shredded green mango, tiger shrimp, roasted peanuts and fresh herbs tossed in sweet-sour-spicy fish sauce dressing.',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
      category: 'Khai V\u1ecb / Appetizers',
      status: 'Available',
      ingredients: 'Green mango, tiger shrimp, roasted peanuts, dried shrimp, mint, cilantro, chili, fish sauce',
      allergens: 'Seafood, Peanuts',
      tags: 'Refreshing, Spicy, Salad'
    },
    {
      name: 'B\u00e1nh Cu\u1ed1n (Steamed Rice Rolls)',
      price: 5,
      description: 'Delicate hand-rolled steamed rice sheets filled with minced pork and wood ear mushrooms, topped with crispy shallots and warm fish sauce.',
      image: 'https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?auto=format&fit=crop&w=600&q=80',
      category: 'Khai V\u1ecb / Appetizers',
      status: 'Available',
      ingredients: 'Rice flour, pork mince, wood ear mushrooms, shallots, fish sauce, bean sprouts',
      allergens: 'None',
      tags: 'Northern Vietnam, Steamed, Light'
    },
    // NOODLE SOUPS
    {
      name: 'Ph\u1edf B\u00f2 T\u00e1i N\u1ea1m (Beef Pho)',
      price: 8,
      description: 'Signature 18-hour slow-simmered beef bone broth with charred ginger, star anise, cinnamon. Served with silky fresh pho noodles, rare beef and well-done brisket.',
      image: 'https://images.unsplash.com/photo-1562707666-0ef913ded2e5?auto=format&fit=crop&w=600&q=80',
      category: 'Ph\u1edf & B\u00fan / Noodle Soups',
      status: 'Available',
      ingredients: 'Beef bones, oxtail, rare beef, brisket, pho noodles, star anise, cinnamon, charred onion, ginger',
      allergens: 'None',
      tags: 'Best Seller, Signature, Northern Vietnam'
    },
    {
      name: 'B\u00fan B\u00f2 Hu\u1ebf (Hue Spicy Noodle Soup)',
      price: 8,
      description: 'Fiery and aromatic Central Vietnam soup with round rice noodles, braised beef shank, pork hock in a complex lemongrass-shrimp paste broth.',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
      category: 'Ph\u1edf & B\u00fan / Noodle Soups',
      status: 'Available',
      ingredients: 'Round rice noodles, beef shank, pork hock, lemongrass, shrimp paste, chili, scallions',
      allergens: 'Seafood',
      tags: 'Spicy, Central Vietnam, Hearty'
    },
    {
      name: 'B\u00fan Ch\u1ea3 H\u00e0 N\u1ed9i (Grilled Pork Vermicelli)',
      price: 8,
      description: 'Hanoi-style grilled pork patties and caramelised pork belly served alongside cold rice vermicelli, fresh herbs and a warm fish sauce broth.',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
      category: 'Ph\u1edf & B\u00fan / Noodle Soups',
      status: 'Available',
      ingredients: 'Pork patties, pork belly, rice vermicelli, fish sauce, garlic, chili, green papaya',
      allergens: 'None',
      tags: 'Northern Vietnam, Grilled, Must-Try'
    },
    {
      name: 'B\u00fan Ri\u00eau Cua (Crab Tomato Noodle Soup)',
      price: 8,
      description: 'Tangy tomato-based broth enriched with freshwater crab paste, silken tofu and tomato. Topped with crispy tofu puffs and fresh herbs.',
      image: 'https://images.unsplash.com/photo-1569562211093-4b4b4b16f31b?auto=format&fit=crop&w=600&q=80',
      category: 'Ph\u1edf & B\u00fan / Noodle Soups',
      status: 'Available',
      ingredients: 'Rice vermicelli, crab paste, tomatoes, silken tofu, shrimp paste, scallions, mint',
      allergens: 'Seafood',
      tags: 'Southern Vietnam, Tangy, Unique'
    },
    {
      name: 'M\u00ec Qu\u1ea3ng (Quang Noodle)',
      price: 7,
      description: 'Central Vietnam pride: wide turmeric-tinted rice noodles with pork, shrimp, peanuts and sesame rice crackers. Garnished with fresh herbs and banana flower.',
      image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=80',
      category: 'Ph\u1edf & B\u00fan / Noodle Soups',
      status: 'Available',
      ingredients: 'Wide turmeric noodles, pork, shrimp, peanuts, sesame rice cracker, banana flower, herbs',
      allergens: 'Seafood, Peanuts, Gluten',
      tags: 'Da Nang, Unique, Must-Try'
    },
    // RICE DISHES
    {
      name: 'C\u01a1m T\u1ea5m S\u01b0\u1eddn B\u00ec Ch\u1ea3 (Broken Rice Combo)',
      price: 7,
      description: 'Saigon iconic broken rice topped with grilled pork chop, shredded pork skin, steamed egg cake, pickled vegetables, cucumber and fish sauce.',
      image: 'https://images.unsplash.com/photo-1567529684892-09290a1b2d05?auto=format&fit=crop&w=600&q=80',
      category: 'C\u01a1m / Rice Dishes',
      status: 'Available',
      ingredients: 'Broken rice, pork chop, shredded pork skin, steamed egg cake, cucumber, pickled daikon, fish sauce',
      allergens: 'Egg, Soy',
      tags: 'Best Seller, Saigon, Iconic'
    },
    {
      name: 'C\u01a1m Chi\u00ean D\u01b0\u01a1ng Ch\u00e2u (Yang Chow Fried Rice)',
      price: 6,
      description: 'Classic wok-fried jasmine rice with BBQ pork, prawns, scrambled egg, spring onion, carrots and peas. Light, fragrant and satisfying.',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
      category: 'C\u01a1m / Rice Dishes',
      status: 'Available',
      ingredients: 'Jasmine rice, BBQ pork, prawns, egg, peas, carrots, soy sauce, sesame oil',
      allergens: 'Seafood, Egg, Soy',
      tags: 'Fried Rice, Classic, Popular'
    },
    {
      name: 'C\u01a1m G\u00e0 H\u1ed9i An (Hoi An Chicken Rice)',
      price: 6,
      description: 'Hoi An-style chicken rice: fluffy turmeric-scented rice cooked in chicken broth, topped with poached chicken and ginger-fish sauce.',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
      category: 'C\u01a1m / Rice Dishes',
      status: 'Available',
      ingredients: 'Turmeric rice, poached chicken, ginger, scallions, pickled papaya, fish sauce',
      allergens: 'None',
      tags: 'Central Vietnam, Healthy, Comforting'
    },
    {
      name: 'C\u01a1m Rang H\u1ea3i S\u1ea3n (Seafood Fried Rice)',
      price: 9,
      description: 'Wok-fired fried rice with tiger prawns, squid, scallops and fish cake. Tossed with egg, mixed vegetables, oyster sauce and sesame oil.',
      image: 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?auto=format&fit=crop&w=600&q=80',
      category: 'C\u01a1m / Rice Dishes',
      status: 'Available',
      ingredients: 'Jasmine rice, tiger prawns, squid, scallops, fish cake, egg, oyster sauce, sesame oil',
      allergens: 'Seafood, Egg, Soy',
      tags: 'Seafood, Premium, Wok-Fried'
    },
    // SEAFOOD
    {
      name: 'T\u00f4m S\u00fa N\u01b0\u1edbng Mu\u1ed1i \u1eee t (Salt & Chilli Tiger Prawns)',
      price: 16,
      description: 'Whole tiger prawns butterflied and grilled over charcoal with Vietnamese salt, chilli and lemongrass marinade. Served with lime wedges and house dipping sauce.',
      image: 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=600&q=80',
      category: 'H\u1ea3i S\u1ea3n / Seafood',
      status: 'Available',
      ingredients: 'Tiger prawns, salt, chilli, lemongrass, garlic, lime',
      allergens: 'Seafood',
      tags: 'Grilled, Premium, Spicy'
    },
    {
      name: 'Cua Rang Me (Tamarind Crab)',
      price: 22,
      description: 'Whole blue swimmer crab wok-fried in rich tamarind sauce with garlic, chilli, palm sugar and butter. Sweet, tangy and finger-licking delicious.',
      image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      category: 'H\u1ea3i S\u1ea3n / Seafood',
      status: 'Available',
      ingredients: 'Blue swimmer crab, tamarind paste, garlic, chilli, palm sugar, butter, scallions',
      allergens: 'Seafood, Dairy',
      tags: 'Premium, Wok-Fried, Indulgent'
    },
    {
      name: 'C\u00e1 Kho T\u1ed9 (Caramelised Fish in Clay Pot)',
      price: 10,
      description: 'Catfish fillets slow-braised in caramel fish sauce, galangal, chilli and shallots until the sauce thickens to a glossy, sticky coating. A timeless Vietnamese comfort dish.',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
      category: 'H\u1ea3i S\u1ea3n / Seafood',
      status: 'Available',
      ingredients: 'Catfish, caramel fish sauce, galangal, chilli, shallots, coconut water',
      allergens: 'Seafood',
      tags: 'Braised, Southern Vietnam, Comfort Food'
    },
    {
      name: 'M\u1ef1c Chi\u00ean Gi\u00f2n (Crispy Fried Squid)',
      price: 11,
      description: 'Fresh squid rings lightly battered and deep-fried until golden. Served with house sriracha mayo and salt-pepper-lime dipping mix.',
      image: 'https://images.unsplash.com/photo-1535007813814-1e395e61b68a?auto=format&fit=crop&w=600&q=80',
      category: 'H\u1ea3i S\u1ea3n / Seafood',
      status: 'Available',
      ingredients: 'Fresh squid, rice flour, salt, pepper, sriracha, mayonnaise',
      allergens: 'Seafood, Egg, Gluten',
      tags: 'Fried, Popular, Snack'
    },
    {
      name: 'Ngh\u00eau H\u1ea5p X\u1ea3 (Lemongrass Steamed Clams)',
      price: 9,
      description: 'Fresh baby clams steamed in fragrant lemongrass, ginger, galangal, chilli and beer broth. Served with crusty baguette to soak up the broth.',
      image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
      category: 'H\u1ea3i S\u1ea3n / Seafood',
      status: 'Available',
      ingredients: 'Baby clams, lemongrass, ginger, galangal, chilli, beer, scallions, lime',
      allergens: 'Seafood, Gluten',
      tags: 'Steamed, Fresh, Fragrant'
    },
    // GRILLED
    {
      name: 'B\u00f2 N\u01b0\u1edbng L\u00e1 L\u1ed1t (Beef in Betel Leaf)',
      price: 10,
      description: 'Seasoned minced beef with lemongrass, garlic and shallots wrapped in betel leaves and grilled over charcoal. Served with rice vermicelli and dipping sauce.',
      image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80',
      category: 'M\u00f3n N\u01b0\u1edbng / Grilled',
      status: 'Available',
      ingredients: 'Minced beef, betel leaves, lemongrass, garlic, shallots, fish sauce, vermicelli',
      allergens: 'None',
      tags: 'Grilled, Aromatic, Vietnamese Classic'
    },
    {
      name: 'S\u01b0\u1eddn N\u01b0\u1edbng M\u1eadt Ong (Honey Glazed Ribs)',
      price: 13,
      description: 'Baby back pork ribs marinated overnight in honey, fish sauce, lemongrass and five-spice, then slow-grilled over charcoal. Caramelised and incredibly flavourful.',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      category: 'M\u00f3n N\u01b0\u1edbng / Grilled',
      status: 'Available',
      ingredients: 'Pork baby back ribs, honey, fish sauce, lemongrass, five-spice, garlic',
      allergens: 'None',
      tags: 'Grilled, Sticky, Popular'
    },
    {
      name: 'G\u00e0 N\u01b0\u1edbng Mu\u1ed1i \u1eee t (Salt & Chilli Grilled Chicken)',
      price: 11,
      description: 'Half chicken rubbed with sea salt, bird\u2019s eye chilli, lemongrass and turmeric, grilled until the skin is golden and crispy while the flesh remains juicy.',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?auto=format&fit=crop&w=600&q=80',
      category: 'M\u00f3n N\u01b0\u1edbng / Grilled',
      status: 'Available',
      ingredients: 'Chicken, sea salt, chilli, lemongrass, turmeric, garlic',
      allergens: 'None',
      tags: 'Grilled, Spicy, Crispy'
    },
    {
      name: 'Th\u1ecbt Xi\u00ean N\u01b0\u1edbng (Vietnamese BBQ Skewers)',
      price: 8,
      description: 'Assorted skewers of pork belly, beef and chicken marinated in lemongrass, galangal and shrimp paste. Grilled to order over charcoal.',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      category: 'M\u00f3n N\u01b0\u1edbng / Grilled',
      status: 'Available',
      ingredients: 'Pork belly, beef, chicken, lemongrass, galangal, shrimp paste, fish sauce',
      allergens: 'Seafood',
      tags: 'BBQ, Skewers, Grilled'
    },
    // DESSERTS
    {
      name: 'Ch\u00e8 Ba M\u00e0u (Three Colour Dessert)',
      price: 3,
      description: 'Vietnamese layered dessert with red azuki beans, yellow mung bean paste and green pandan jelly, finished with crushed ice and rich coconut cream.',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
      category: 'Tr\u00e1ng Mi\u1ec7ng / Desserts',
      status: 'Available',
      ingredients: 'Azuki beans, mung beans, pandan jelly, coconut cream, sugar syrup, crushed ice',
      allergens: 'None',
      tags: 'Sweet, Cold, Traditional'
    },
    {
      name: 'B\u00e1nh Flan Caramel (Cr\u00e8me Caramel)',
      price: 3,
      description: 'Classic silken custard with a dark caramel top. Uses eggs, condensed milk and a hint of vanilla \u2014 lighter than the French version, creamy and not overly sweet.',
      image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=600&q=80',
      category: 'Tr\u00e1ng Mi\u1ec7ng / Desserts',
      status: 'Available',
      ingredients: 'Eggs, condensed milk, sugar, vanilla, caramel',
      allergens: 'Egg, Dairy',
      tags: 'French-Vietnamese, Smooth, Sweet'
    },
    {
      name: 'Kem D\u1eeba Non (Young Coconut Ice Cream)',
      price: 4,
      description: 'Fresh young coconut ice cream served in a real coconut shell, topped with pandan syrup, toasted peanuts and coconut jelly strips.',
      image: 'https://images.unsplash.com/photo-1629385701021-fcd0a0f5c573?auto=format&fit=crop&w=600&q=80',
      category: 'Tr\u00e1ng Mi\u1ec7ng / Desserts',
      status: 'Available',
      ingredients: 'Young coconut ice cream, pandan syrup, roasted peanuts, coconut jelly, young coconut water',
      allergens: 'Dairy, Peanuts',
      tags: 'Cold, Tropical, Instagrammable'
    },
    {
      name: 'Ch\u00e8 Kh\u00fac B\u1ea1ch (Almond Jelly Dessert)',
      price: 4,
      description: 'Elegant Vietnamese dessert with almond milk jelly cubes, lychees, longan, fresh mango and multicoloured tapioca pearls in chilled coconut milk.',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
      category: 'Tr\u00e1ng Mi\u1ec7ng / Desserts',
      status: 'Available',
      ingredients: 'Almond jelly, lychee, longan, mango, tapioca pearls, coconut milk',
      allergens: 'None',
      tags: 'Instagram, Elegant, Refreshing'
    },
    {
      name: 'Tr\u00e1i C\u00e2y Th\u1eadp C\u1ea9m (Tropical Fruit Platter)',
      price: 5,
      description: 'Seasonal tropical fruits including dragon fruit, mango, pineapple, papaya and watermelon, artfully arranged and served chilled.',
      image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80',
      category: 'Tr\u00e1ng Mi\u1ec7ng / Desserts',
      status: 'Available',
      ingredients: 'Dragon fruit, mango, pineapple, papaya, watermelon',
      allergens: 'None',
      tags: 'Healthy, Fresh, Seasonal'
    },
    // BEVERAGES
    {
      name: 'C\u00e0 Ph\u00ea S\u1eefa \u0110\u00e1 (Vietnamese Iced Coffee)',
      price: 3,
      description: 'Strong Robusta coffee slowly dripped through a traditional Vietnamese phin filter, mixed with sweetened condensed milk and poured over crushed ice.',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Robusta coffee, sweetened condensed milk, crushed ice',
      allergens: 'Dairy',
      tags: 'Vietnamese Coffee, Best Seller, Energising'
    },
    {
      name: 'Tr\u00e0 Sen T\u00e2y H\u1ed3 (West Lake Lotus Tea)',
      price: 3,
      description: 'Premium green tea scented overnight with fresh West Lake lotus blossoms. A signature Vietnamese tea with a naturally floral, soothing aroma.',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Green tea, fresh lotus blossoms',
      allergens: 'None',
      tags: 'Traditional, Floral, Refined'
    },
    {
      name: 'Sinh T\u1ed1 B\u01a1 (Avocado Smoothie)',
      price: 4,
      description: 'Thick and creamy blended ripe avocado with condensed milk, fresh milk and crushed ice. One of Vietnam\u2019s most beloved caf\u00e9 drinks.',
      image: 'https://images.unsplash.com/photo-1638437447450-de6fd917e0e6?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Ripe avocado, condensed milk, fresh milk, crushed ice',
      allergens: 'Dairy',
      tags: 'Smoothie, Creamy, Nutritious'
    },
    {
      name: 'N\u01b0\u1edbc Chanh D\u00e2y (Passion Fruit Juice)',
      price: 3,
      description: 'Fresh passion fruit juice mixed with soda water, mint leaves and ice. Tropical and revitalising.',
      image: 'https://images.unsplash.com/photo-1609171695284-a7dd9b3cb0e5?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Fresh passion fruit, soda water, sugar syrup, mint, ice',
      allergens: 'None',
      tags: 'Juice, Tropical, Refreshing'
    },
    {
      name: 'Tr\u00e0 \u0110\u00e0o Cam S\u1ea3 (Peach Lemongrass Tea)',
      price: 3,
      description: 'Refreshing iced tea blended with lemongrass, fresh peach, orange zest and honey. Sweet, floral and beautifully fragrant.',
      image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Black tea, lemongrass, peach, orange, honey, ice',
      allergens: 'None',
      tags: 'Fruit Tea, Iced, Popular'
    },
    {
      name: 'Bia Saigon (Saigon Special Lager)',
      price: 2,
      description: 'Vietnam\u2019s favourite golden lager \u2014 light, crisp and perfectly refreshing. Best enjoyed ice-cold alongside grilled dishes.',
      image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Saigon Special Lager (can/bottle)',
      allergens: 'Gluten',
      tags: 'Beer, Alcoholic, Cold'
    },
    {
      name: 'R\u01b0\u1ee3u Vang \u0110\u1ecf (House Red Wine)',
      price: 8,
      description: 'A curated glass of full-bodied Cabernet Sauvignon from our house wine programme. Rich dark fruit, smooth tannins.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Cabernet Sauvignon red wine',
      allergens: 'Sulfites',
      tags: 'Wine, Premium, Alcoholic'
    },
    {
      name: 'N\u01b0\u1edbc Su\u1ed1i Lavie (Mineral Water)',
      price: 1,
      description: 'Chilled Lavie natural spring water, bottled at source.',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80',
      category: '\u0110\u1ed3 U\u1ed1ng / Beverages',
      status: 'Available',
      ingredients: 'Natural spring water (Lavie, 500ml)',
      allergens: 'None',
      tags: 'Water, Basic, Cold'
    }
  ]

  const dishes: any[] = []
  const dishSnapshots: any[] = []
  for (const data of dishData) {
    const d = await prisma.dish.create({ data })
    const snap = await prisma.dishSnapshot.create({
      data: {
        name: d.name,
        price: d.price,
        description: d.description,
        image: d.image,
        category: d.category,
        status: d.status,
        ingredients: d.ingredients ?? '',
        allergens: d.allergens ?? 'None',
        tags: d.tags ?? '',
        dishId: d.id
      }
    })
    dishes.push(d)
    dishSnapshots.push(snap)
  }
  console.log(`\u2705 ${dishes.length} dishes + ${dishSnapshots.length} snapshots created\n`)

  // ===========================================================
  // 5. TABLES — 5 tables
  // ===========================================================
  console.log('\u{1FA91} Creating tables...')
  const tableData = [
    { number: 1, capacity: 2, token: randomUUID() },
    { number: 2, capacity: 2, token: randomUUID() },
    { number: 3, capacity: 4, token: randomUUID() },
    { number: 4, capacity: 4, token: randomUUID() },
    { number: 5, capacity: 6, token: randomUUID() }
  ]
  const tables: any[] = []
  for (const t of tableData) {
    const tbl = await prisma.table.create({ data: t })
    tables.push(tbl)
  }
  console.log(`\u2705 ${tables.length} tables created\n`)

  // ===========================================================
  // 6. COUPONS
  // ===========================================================
  console.log('\u{1F3F7}\uFE0F  Creating coupons...')
  const couponWelcome = await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 10,
      startDate: new Date(),
      endDate: daysFromNow(365),
      status: 'ACTIVE',
      createdById: owner.id,
      maxTotalUsage: 200,
      maxUsagePerGuest: 1,
      usageCount: 0
    }
  })

  await prisma.coupon.create({
    data: {
      code: 'BIGBOY50',
      discountType: 'FIXED_AMOUNT',
      discountValue: 5,
      minOrderAmount: 20,
      startDate: new Date(),
      endDate: daysFromNow(180),
      status: 'ACTIVE',
      createdById: owner.id,
      maxTotalUsage: 100,
      maxUsagePerGuest: 2,
      usageCount: 0
    }
  })

  await prisma.coupon.create({
    data: {
      code: 'SUMMER25',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      minOrderAmount: 30,
      startDate: new Date(),
      endDate: daysFromNow(90),
      status: 'ACTIVE',
      createdById: owner.id,
      maxTotalUsage: 50,
      maxUsagePerGuest: 1,
      usageCount: 0
    }
  })
  console.log('\u2705 3 coupons created (WELCOME10, BIGBOY50, SUMMER25)\n')

  // ===========================================================
  // 7. GUESTS
  // ===========================================================
  console.log('\u{1F464} Creating guests...')
  const guest1 = await prisma.guest.create({ data: { name: 'Nguy\u1ec5n V\u0103n An', tableNumber: tables[0].number } })
  const guest2 = await prisma.guest.create({ data: { name: 'Tr\u1ea7n Th\u1ecb B\u00ecnh', tableNumber: tables[1].number } })
  const guest3 = await prisma.guest.create({ data: { name: 'Aleksei Petrov', tableNumber: tables[2].number } })
  const guest4 = await prisma.guest.create({ data: { name: 'Maria Ivanova', tableNumber: tables[3].number } })
  const guest5 = await prisma.guest.create({ data: { name: 'James Wilson', tableNumber: tables[4].number } })
  console.log('\u2705 5 guests created\n')

  // ===========================================================
  // 8. ORDERS + ORDER ITEMS
  // ===========================================================
  console.log('\u{1F6D2} Creating orders and order items...')

  const snap = (keyword: string) => {
    const s = dishSnapshots.find((ds: any) =>
      ds.name.toLowerCase().includes(keyword.toLowerCase())
    )
    if (!s) throw new Error(`Snapshot not found: ${keyword}`)
    return s
  }

  const order1 = await prisma.order.create({
    data: {
      guestId: guest1.id,
      tableNumber: tables[0].number,
      totalAmount: snap('Ph\u1edf').price + snap('G\u1ecfi Cu\u1ed1n').price + snap('C\u00e0 Ph\u00ea').price * 2,
      status: 'Paid',
      orderHandlerId: emp1.id,
      items: {
        create: [
          { dishSnapshotId: snap('Ph\u1edf').id, quantity: 1, unitPrice: snap('Ph\u1edf').price, totalPrice: snap('Ph\u1edf').price },
          { dishSnapshotId: snap('G\u1ecfi Cu\u1ed1n').id, quantity: 1, unitPrice: snap('G\u1ecfi Cu\u1ed1n').price, totalPrice: snap('G\u1ecfi Cu\u1ed1n').price },
          { dishSnapshotId: snap('C\u00e0 Ph\u00ea').id, quantity: 2, unitPrice: snap('C\u00e0 Ph\u00ea').price, totalPrice: snap('C\u00e0 Ph\u00ea').price * 2 }
        ]
      }
    }
  })

  const order2Total = snap('C\u01a1m T\u1ea5m').price + snap('B\u00fan Ch\u1ea3').price + snap('Tr\u00e0 Sen').price
  const order2Discount = Math.round(order2Total * 0.1) // integer discount
  const order2 = await prisma.order.create({
    data: {
      guestId: guest2.id,
      tableNumber: tables[1].number,
      totalAmount: order2Total,
      discountAmount: order2Discount,
      status: 'Paid',
      orderHandlerId: emp1.id,
      couponId: couponWelcome.id,
      items: {
        create: [
          { dishSnapshotId: snap('C\u01a1m T\u1ea5m').id, quantity: 1, unitPrice: snap('C\u01a1m T\u1ea5m').price, totalPrice: snap('C\u01a1m T\u1ea5m').price },
          { dishSnapshotId: snap('B\u00fan Ch\u1ea3').id, quantity: 1, unitPrice: snap('B\u00fan Ch\u1ea3').price, totalPrice: snap('B\u00fan Ch\u1ea3').price },
          { dishSnapshotId: snap('Tr\u00e0 Sen').id, quantity: 1, unitPrice: snap('Tr\u00e0 Sen').price, totalPrice: snap('Tr\u00e0 Sen').price }
        ]
      }
    }
  })

  const order3 = await prisma.order.create({
    data: {
      guestId: guest3.id,
      tableNumber: tables[2].number,
      totalAmount: snap('T\u00f4m S\u00fa').price + snap('Cua Rang').price + snap('Bia').price * 2,
      status: 'Paid',
      orderHandlerId: emp2.id,
      items: {
        create: [
          { dishSnapshotId: snap('T\u00f4m S\u00fa').id, quantity: 1, unitPrice: snap('T\u00f4m S\u00fa').price, totalPrice: snap('T\u00f4m S\u00fa').price },
          { dishSnapshotId: snap('Cua Rang').id, quantity: 1, unitPrice: snap('Cua Rang').price, totalPrice: snap('Cua Rang').price },
          { dishSnapshotId: snap('Bia').id, quantity: 2, unitPrice: snap('Bia').price, totalPrice: snap('Bia').price * 2 }
        ]
      }
    }
  })

  const order4 = await prisma.order.create({
    data: {
      guestId: guest4.id,
      tableNumber: tables[3].number,
      totalAmount: snap('B\u00f2 N\u01b0\u1edbng').price + snap('S\u01b0\u1eddn N\u01b0\u1edbng').price + snap('Sinh T\u1ed1').price * 2,
      status: 'Delivered',
      orderHandlerId: emp2.id,
      items: {
        create: [
          { dishSnapshotId: snap('B\u00f2 N\u01b0\u1edbng').id, quantity: 1, unitPrice: snap('B\u00f2 N\u01b0\u1edbng').price, totalPrice: snap('B\u00f2 N\u01b0\u1edbng').price },
          { dishSnapshotId: snap('S\u01b0\u1eddn N\u01b0\u1edbng').id, quantity: 1, unitPrice: snap('S\u01b0\u1eddn N\u01b0\u1edbng').price, totalPrice: snap('S\u01b0\u1eddn N\u01b0\u1edbng').price },
          { dishSnapshotId: snap('Sinh T\u1ed1').id, quantity: 2, unitPrice: snap('Sinh T\u1ed1').price, totalPrice: snap('Sinh T\u1ed1').price * 2 }
        ]
      }
    }
  })

  const order5 = await prisma.order.create({
    data: {
      guestId: guest5.id,
      tableNumber: tables[4].number,
      totalAmount: snap('M\u1ef1c').price + snap('Ngh\u00eau').price + snap('Ch\u1ea3 Gi\u00f2').price * 2 + snap('R\u01b0\u1ee3u').price,
      status: 'Delivered',
      orderHandlerId: emp3.id,
      items: {
        create: [
          { dishSnapshotId: snap('M\u1ef1c').id, quantity: 1, unitPrice: snap('M\u1ef1c').price, totalPrice: snap('M\u1ef1c').price },
          { dishSnapshotId: snap('Ngh\u00eau').id, quantity: 1, unitPrice: snap('Ngh\u00eau').price, totalPrice: snap('Ngh\u00eau').price },
          { dishSnapshotId: snap('Ch\u1ea3 Gi\u00f2').id, quantity: 2, unitPrice: snap('Ch\u1ea3 Gi\u00f2').price, totalPrice: snap('Ch\u1ea3 Gi\u00f2').price * 2 },
          { dishSnapshotId: snap('R\u01b0\u1ee3u').id, quantity: 1, unitPrice: snap('R\u01b0\u1ee3u').price, totalPrice: snap('R\u01b0\u1ee3u').price }
        ]
      }
    }
  })

  const order6 = await prisma.order.create({
    data: {
      guestId: guest1.id,
      tableNumber: tables[0].number,
      totalAmount: snap('B\u00e1nh X\u00e8o').price + snap('G\u00e0 N\u01b0\u1edbng').price,
      status: 'Processing',
      orderHandlerId: emp1.id,
      items: {
        create: [
          { dishSnapshotId: snap('B\u00e1nh X\u00e8o').id, quantity: 1, unitPrice: snap('B\u00e1nh X\u00e8o').price, totalPrice: snap('B\u00e1nh X\u00e8o').price },
          { dishSnapshotId: snap('G\u00e0 N\u01b0\u1edbng').id, quantity: 1, unitPrice: snap('G\u00e0 N\u01b0\u1edbng').price, totalPrice: snap('G\u00e0 N\u01b0\u1edbng').price }
        ]
      }
    }
  })

  const order7 = await prisma.order.create({
    data: {
      guestId: guest2.id,
      tableNumber: tables[1].number,
      totalAmount: snap('B\u00fan Ri\u00eau').price + snap('Ch\u00e8 Ba').price + snap('Tr\u00e0 \u0110\u00e0o').price * 2,
      status: 'Pending',
      orderHandlerId: emp1.id,
      items: {
        create: [
          { dishSnapshotId: snap('B\u00fan Ri\u00eau').id, quantity: 1, unitPrice: snap('B\u00fan Ri\u00eau').price, totalPrice: snap('B\u00fan Ri\u00eau').price },
          { dishSnapshotId: snap('Ch\u00e8 Ba').id, quantity: 1, unitPrice: snap('Ch\u00e8 Ba').price, totalPrice: snap('Ch\u00e8 Ba').price },
          { dishSnapshotId: snap('Tr\u00e0 \u0110\u00e0o').id, quantity: 2, unitPrice: snap('Tr\u00e0 \u0110\u00e0o').price, totalPrice: snap('Tr\u00e0 \u0110\u00e0o').price * 2 }
        ]
      }
    }
  })

  const order8 = await prisma.order.create({
    data: {
      guestId: guest3.id,
      tableNumber: tables[2].number,
      totalAmount: snap('C\u01a1m G\u00e0').price + snap('C\u00e1 Kho').price + snap('N\u01b0\u1edbc Su\u1ed1i').price * 2,
      status: 'Pending',
      orderHandlerId: emp3.id,
      items: {
        create: [
          { dishSnapshotId: snap('C\u01a1m G\u00e0').id, quantity: 1, unitPrice: snap('C\u01a1m G\u00e0').price, totalPrice: snap('C\u01a1m G\u00e0').price },
          { dishSnapshotId: snap('C\u00e1 Kho').id, quantity: 1, unitPrice: snap('C\u00e1 Kho').price, totalPrice: snap('C\u00e1 Kho').price },
          { dishSnapshotId: snap('N\u01b0\u1edbc Su\u1ed1i').id, quantity: 2, unitPrice: snap('N\u01b0\u1edbc Su\u1ed1i').price, totalPrice: snap('N\u01b0\u1edbc Su\u1ed1i').price * 2 }
        ]
      }
    }
  })

  console.log('\u2705 8 orders created (3 Paid, 2 Delivered, 1 Processing, 2 Pending)\n')

  // ===========================================================
  // 9. PAYMENTS
  // ===========================================================
  console.log('\u{1F4B3} Creating payments...')

  const pay1 = await prisma.payment.create({
    data: {
      guestId: guest1.id,
      tableNumber: tables[0].number,
      amount: order1.totalAmount,
      paymentMethod: 'Cash',
      status: 'Paid',
      transactionRef: `CASH-${Date.now()}-001`,
      paymentHandlerId: emp1.id,
      paidAt: new Date(),
      currency: 'USD',
      orders: { connect: [{ id: order1.id }] }
    }
  })
  await prisma.order.update({ where: { id: order1.id }, data: { paymentId: pay1.id } })

  const pay2 = await prisma.payment.create({
    data: {
      guestId: guest2.id,
      tableNumber: tables[1].number,
      amount: order2.totalAmount - order2Discount,
      paymentMethod: 'VNPay',
      status: 'Paid',
      transactionRef: `VNPAY-${Date.now()}-002`,
      couponId: couponWelcome.id,
      discountAmount: order2Discount,
      paymentHandlerId: emp1.id,
      paidAt: new Date(),
      currency: 'USD',
      orders: { connect: [{ id: order2.id }] }
    }
  })
  await prisma.order.update({ where: { id: order2.id }, data: { paymentId: pay2.id } })

  const pay3 = await prisma.payment.create({
    data: {
      guestId: guest3.id,
      tableNumber: tables[2].number,
      amount: order3.totalAmount,
      paymentMethod: 'Stripe',
      status: 'Paid',
      transactionRef: `STRIPE-${Date.now()}-003`,
      paymentHandlerId: emp2.id,
      paidAt: new Date(),
      currency: 'USD',
      orders: { connect: [{ id: order3.id }] }
    }
  })
  await prisma.order.update({ where: { id: order3.id }, data: { paymentId: pay3.id } })

  const pay4 = await prisma.payment.create({
    data: {
      guestId: guest4.id,
      tableNumber: tables[3].number,
      amount: order4.totalAmount,
      paymentMethod: 'YooKassa',
      status: 'Paid',
      transactionRef: `YOO-${Date.now()}-004`,
      paymentHandlerId: emp2.id,
      paidAt: new Date(),
      currency: 'USD',
      orders: { connect: [{ id: order4.id }] }
    }
  })
  await prisma.order.update({ where: { id: order4.id }, data: { paymentId: pay4.id } })

  console.log('\u2705 4 payments created (Cash, VNPay, Stripe, YooKassa)\n')

  // ===========================================================
  // 10. COUPON USAGES
  // ===========================================================
  console.log('\u{1F3AB} Creating coupon usages...')
  await prisma.couponUsage.create({
    data: {
      couponId: couponWelcome.id,
      guestId: guest2.id,
      orderId: order2.id,
      paymentId: pay2.id,
      discountAmount: order2Discount
    }
  })
  await prisma.coupon.update({ where: { id: couponWelcome.id }, data: { usageCount: 1 } })
  console.log('\u2705 1 coupon usage recorded\n')

  // ===========================================================
  // 11. REVIEWS
  // ===========================================================
  console.log('\u2B50 Creating reviews...')
  const reviewsData = [
    {
      guestId: guest1.id,
      overallRating: 5, foodQuality: 5, serviceQuality: 5, ambiance: 5, priceValue: 5,
      comment: 'Ph\u1edf \u1edf \u0111\u00e2y th\u1ef1c s\u1ef1 tuy\u1ec7t v\u1eddi! N\u01b0\u1edbc d\u00f9ng \u0111\u1eadm \u0111\u00e0, th\u1ecbt b\u00f2 m\u1ec1m, rau th\u01a1m t\u01b0\u01a1i. Nh\u00e2n vi\u00ean ph\u1ee5c v\u1ee5 nhi\u1ec7t t\u00ecnh v\u00e0 chuy\u00ean nghi\u1ec7p. S\u1ebd quay l\u1ea1i nhi\u1ec1u l\u1ea7n n\u1eef a!',
      status: 'VISIBLE',
      approvedBy: owner.id,
      approvedAt: new Date(),
      replyContent: 'C\u1ea3m \u01a1n b\u1ea1n r\u1ea5t nhi\u1ec1u! Ch\u00fang t\u00f4i r\u1ea5t vui khi \u0111\u01b0\u1ee3c ph\u1ee5c v\u1ee5 b\u1ea1n. H\u1eb9n g\u1eb7p l\u1ea1i! \u{1F35C}',
      repliedBy: owner.id,
      repliedAt: new Date()
    },
    {
      guestId: guest2.id,
      overallRating: 5, foodQuality: 5, serviceQuality: 4, ambiance: 5, priceValue: 4,
      comment: 'C\u01a1m t\u1ea5m v\u00e0 b\u00fan ch\u1ea3 \u0111\u1ec1u r\u1ea5t ngon! \u0110\u1eb7c bi\u1ec7t l\u00e0 n\u01b0\u1edbc ch\u1ea5m t\u1ef1 l\u00e0m c\u00f3 h\u01b0\u01a1ng v\u1ecb r\u1ea5t chu\u1ea9n. Kh\u00f4ng gian nh\u00e0 h\u00e0ng s\u1ea1ch s\u1ebd, tho\u00e1ng m\u00e1t.',
      status: 'VISIBLE',
      approvedBy: owner.id,
      approvedAt: new Date(),
      replyContent: 'C\u1ea3m \u01a1n b\u1ea1n \u0111\u00e3 d\u00e0nh th\u1eddi gian \u0111\u00e1nh gi\u00e1! Ch\u00fang t\u00f4i lu\u00f4n n\u1ed7 l\u1ef1c mang l\u1ea1i tr\u1ea3i nghi\u1ec7m t\u1ed1t nh\u1ea5t.',
      repliedBy: emp1.id,
      repliedAt: new Date()
    },
    {
      guestId: guest3.id,
      overallRating: 5, foodQuality: 5, serviceQuality: 5, ambiance: 4, priceValue: 5,
      comment: '\u041e\u0447\u0435\u043d\u044c \u0432\u043a\u0443\u0441\u043d\u0430\u044f \u0435\u0434\u0430! \u0416\u0430\u0440\u0435\u043d\u044b\u0435 \u043a\u0440\u0435\u0432\u0435\u0442\u043a\u0438 \u0438 \u043a\u0440\u0430\u0431 \u0432 \u0442\u0430\u043c\u0430\u0440\u0438\u043d\u0434\u043e\u0432\u043e\u043c \u0441\u043e\u0443\u0441\u0435 \u2014 \u043d\u0435\u0447\u0442\u043e \u043d\u0435\u0432\u0435\u0440\u043e\u044f\u0442\u043d\u043e\u0435! \u041f\u0435\u0440\u0441\u043e\u043d\u0430\u043b \u043e\u0447\u0435\u043d\u044c \u0434\u0440\u0443\u0436\u0435\u043b\u044e\u0431\u0438\u0432\u044b\u0439. \u041e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e \u0432\u0435\u0440\u043d\u0451\u043c\u0441\u044f!',
      status: 'VISIBLE',
      approvedBy: owner.id,
      approvedAt: new Date()
    },
    {
      guestId: guest4.id,
      overallRating: 4, foodQuality: 5, serviceQuality: 4, ambiance: 4, priceValue: 4,
      comment: 'Excellent grilled dishes! The honey ribs are absolutely fantastic \u2014 tender, caramelised and packed with flavour. The lemongrass grilled chicken was also a highlight. Highly recommend.',
      status: 'VISIBLE',
      approvedBy: owner.id,
      approvedAt: new Date(),
      replyContent: 'Thank you so much for your kind words! Our chef will be delighted to hear this. See you again soon! \u{1F956}',
      repliedBy: owner.id,
      repliedAt: new Date()
    },
    {
      guestId: guest5.id,
      overallRating: 5, foodQuality: 5, serviceQuality: 5, ambiance: 5, priceValue: 5,
      comment: 'Best Vietnamese restaurant I\u2019ve been to outside Vietnam! The banh xeo was crispy perfection, the fresh spring rolls were incredibly fresh. The almond jelly dessert was unique and delightful. 10/10.',
      status: 'VISIBLE',
      approvedBy: owner.id,
      approvedAt: new Date(),
      replyContent: 'Wow, what a wonderful review! The banh xeo is our chef\u2019s personal favourite too! Come back anytime \u{1F64F}',
      repliedBy: emp1.id,
      repliedAt: new Date()
    }
  ]
  for (const r of reviewsData) {
    await prisma.review.create({ data: r })
  }
  console.log('\u2705 5 reviews created (all VISIBLE)\n')

  // ===========================================================
  // 12. BLOG POSTS
  // ===========================================================
  console.log('\u{1F4DD} Creating blog posts...')

  await prisma.blogPost.create({
    data: {
      title: 'The Story Behind Big Boy Restaurant: 10 Years of Vietnamese Flavour',
      slug: 'story-behind-big-boy-restaurant',
      excerpt: 'How a small family kitchen evolved into one of the most beloved Vietnamese restaurants \u2014 a decade of passion, tradition and innovation.',
      category: 'Our Story',
      tags: JSON.stringify(['history', 'vietnamese-cuisine', 'family', 'tradition']),
      featured: true,
      viewCount: 3241,
      featuredImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      authorId: owner.id,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      content: `# The Story Behind Big Boy Restaurant

Ten years ago, our founder Minh Nguy\u1ec5n set up a small kitchen in Ho Chi Minh City with nothing more than his grandmother's handwritten recipe book and a dream.

## Humble Beginnings

The first menu had just five dishes: Ph\u1edf b\u00f2, B\u00e1nh m\u00ec, C\u01a1m t\u1ea5m, G\u1ecfi cu\u1ed1n, and C\u00e0 ph\u00ea s\u1eefa \u0111\u00e1. Every morning, Minh rose at 4 AM to start the bone broth. Every evening, he hand-wrote the next day's specials on a chalkboard.

Word spread quickly. By the end of the first month, there was a queue down the street.

## Growing With Our Community

Over the years, we grew \u2014 not just in size, but in depth. We sourced ingredients from local farms. We added regional dishes from Hanoi, Hue and Da Nang. We hired staff who shared our values.

Today, Big Boy Restaurant employs over 30 people, partners with 25 local suppliers, and serves more than 500 guests daily.

## What Hasn't Changed

Our broth. Still 18 hours. Still the same charred ginger and star anise technique Minh's grandmother used in her kitchen in Hanoi.

Some things should never change.

---

*Come taste our story. We think you'll feel it in every bowl.*`
    }
  })

  await prisma.blogPost.create({
    data: {
      title: 'Fresh Summer Menu: 8 New Dishes You Must Try This Season',
      slug: 'fresh-summer-menu-new-dishes',
      excerpt: `Our chefs have crafted 8 exciting new dishes using the freshest seasonal ingredients. Here's everything you need to know before your next visit.`,
      category: 'Menu Updates',
      tags: JSON.stringify(['new-menu', 'summer', 'seasonal', 'chef-picks']),
      featured: true,
      viewCount: 1872,
      featuredImage: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      authorId: emp1.id,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      content: `# Fresh Summer Menu: 8 New Dishes You Must Try

Summer in Vietnam means abundance \u2014 mangoes, lychees, fresh seafood, and the most vibrant herbs of the year.

## G\u1ecfi Xo\u00e0i T\u00f4m \u2014 Mango Shrimp Salad (New!)

Extra-sour young Canh mango from \u0110\u1ed3ng Th\u00e1p. The balance of sweet, sour, salty and spicy is exactly right.

## Ch\u00e8 Kh\u00fac B\u1ea1ch \u2014 Almond Jelly Dessert (New!)

A stunning dessert with almond milk jelly, fresh lychees, longans and mango in coconut cream.

## Tr\u00e0 \u0110\u00e0o Cam S\u1ea3 \u2014 Peach Lemongrass Tea (New!)

Fresh lemongrass, peach and orange blossom honey. Our best-selling new drink instantly.

---

*Visit us this summer \u2014 we promise every dish is worth the trip.*`
    }
  })

  console.log('\u2705 2 blog posts created (PUBLISHED)\n')

  // ===========================================================
  // 13. RESTAURANT SETTINGS
  // ===========================================================
  console.log('\u2699\uFE0F  Creating restaurant settings...')
  const settings = [
    { key: 'restaurant_name', value: 'Big Boy Restaurant', label: 'Restaurant Name', group: 'general' },
    { key: 'opening_hours', value: 'Mon\u2013Sun: 10:00 AM \u2013 10:30 PM', label: 'Opening Hours', group: 'general' },
    { key: 'description', value: 'Big Boy Restaurant \u2014 Authentic Vietnamese cuisine reimagined for modern dining. From our legendary 18-hour pho broth to our vibrant seafood dishes, every plate tells a story.', label: 'Description', group: 'general' },
    { key: 'cuisine_type', value: 'Vietnamese & Asian Fusion', label: 'Cuisine Type', group: 'general' },
    { key: 'seating_capacity', value: '80 seats across 5 tables', label: 'Seating Capacity', group: 'general' },
    { key: 'wifi_password', value: 'BigBoy@2025', label: 'WiFi Password', group: 'general' },
    { key: 'established_year', value: '2015', label: 'Established Year', group: 'general' },
    { key: 'phone', value: '+84 28 3821 9999', label: 'Phone Number', group: 'contact' },
    { key: 'email', value: 'hello@bigboy.vn', label: 'Email', group: 'contact' },
    { key: 'address', value: '28 L\u00ea L\u1ee3i, B\u1ebfn Ngh\u00e9, Qu\u1eadn 1, Th\u00e0nh ph\u1ed1 H\u1ed3 Ch\u00ed Minh', label: 'Address', group: 'contact' },
    { key: 'website', value: 'https://qrorder.ru', label: 'Website', group: 'contact' },
    { key: 'reservation_policy', value: 'Reservations accepted up to 14 days in advance. Walk-ins welcome but peak hours may have a 20\u201330 minute wait.', label: 'Reservation Policy', group: 'policies' },
    { key: 'cancellation_policy', value: 'Free cancellation up to 3 hours before your reservation. No-shows for groups of 6+ may incur a deposit forfeiture.', label: 'Cancellation Policy', group: 'policies' },
    { key: 'payment_methods', value: 'Cash, Visa, Mastercard, Momo, ZaloPay, VNPay, Stripe, YooKassa', label: 'Payment Methods', group: 'policies' }
  ]
  for (const s of settings) {
    await prisma.restaurantSetting.create({ data: s })
  }
  console.log('\u2705 14 restaurant settings created\n')

  // ===========================================================
  // 14. FAQs
  // ===========================================================
  console.log('\u2753 Creating FAQs...')
  const faqs = [
    { question: 'What are your opening hours?', answer: 'We are open Monday to Sunday from 10:00 AM to 10:30 PM, including public holidays.', category: 'general', sortOrder: 1 },
    { question: 'Where is Big Boy Restaurant located?', answer: 'We are located at 28 L\u00ea L\u1ee3i, B\u1ebfn Ngh\u00e9, District 1, Ho Chi Minh City \u2014 right in the heart of the city.', category: 'general', sortOrder: 2 },
    { question: 'Do you have parking?', answer: 'Yes, we have supervised parking 50 metres from the entrance. Motorbike parking is free. Car parking is 30,000 VND/hour.', category: 'general', sortOrder: 3 },
    { question: 'What is the WiFi password?', answer: 'Connect to the "BigBoy_Guest" network. Password: BigBoy@2025. Speed: 100 Mbps.', category: 'general', sortOrder: 4 },
    { question: 'Is there a dress code?', answer: 'Smart casual is preferred. We are a welcoming environment \u2014 no strict dress code.', category: 'general', sortOrder: 5 },
    { question: 'Do you have vegetarian options?', answer: 'Yes! We have G\u1ecfi Xo\u00e0i, Ch\u00e8 Ba M\u00e0u, Tr\u00e1i C\u00e2y Th\u1eadp C\u1ea9m and more. Filter by "Vegetarian" tag in our menu.', category: 'menu', sortOrder: 1 },
    { question: 'How do I know if a dish contains my allergen?', answer: 'Every dish includes a full allergen list. You can also ask any staff member for assistance.', category: 'menu', sortOrder: 2 },
    { question: 'What is your most popular dish?', answer: 'Ph\u1edf B\u00f2 T\u00e1i N\u1ea1m (18-hour beef pho) and C\u01a1m T\u1ea5m S\u01b0\u1eddn B\u00ec Ch\u1ea3 (Saigon broken rice) are consistently our top sellers.', category: 'menu', sortOrder: 3 },
    { question: 'Can I customise my order?', answer: 'Yes! Add special instructions (no chilli, extra lime, etc.) when ordering via QR code. For complex modifications, speak with your server directly.', category: 'menu', sortOrder: 4 },
    { question: 'Do you offer delivery?', answer: 'Yes! We deliver via GrabFood, ShopeeFood, and Baemin within a 10km radius.', category: 'delivery', sortOrder: 1 },
    { question: 'What is the minimum delivery order?', answer: 'Minimum order is $15 USD. Orders over $40 qualify for free delivery.', category: 'delivery', sortOrder: 2 },
    { question: 'How long does delivery take?', answer: 'Typically 30\u201345 minutes. During peak hours allow up to 60 minutes.', category: 'delivery', sortOrder: 3 },
    { question: 'What payment methods do you accept?', answer: 'In-restaurant: Cash, Visa, Mastercard, Momo, ZaloPay, VNPay. Online: Stripe, YooKassa, VNPay.', category: 'payment', sortOrder: 1 },
    { question: 'Can I use a discount coupon?', answer: 'Yes! Active coupons: WELCOME10 (10% off first order), BIGBOY50 ($5 off orders over $20), SUMMER25 (25% off orders over $30).', category: 'payment', sortOrder: 2 },
    { question: 'How do I make a reservation?', answer: 'Call +84 28 3821 9999, email hello@bigboy.vn, or book through our website. Recommend 24 hours in advance for groups of 6+.', category: 'reservation', sortOrder: 1 },
    { question: 'Do you host private events?', answer: 'Yes! Private dining for groups of 10\u201380 guests. Contact events@bigboy.vn for enquiries.', category: 'reservation', sortOrder: 2 }
  ]
  for (const f of faqs) {
    await prisma.fAQ.create({ data: f })
  }
  console.log('\u2705 16 FAQs created\n')

  // ===========================================================
  // 15. CALENDAR TYPES + EVENTS + ASSIGNMENTS + NOTIFICATIONS
  // ===========================================================
  console.log('\u{1F4C5} Creating calendar data...')

  const shiftType = await prisma.calendarType.create({
    data: { name: 'work_shift', label: 'Work Shifts', color: 'bg-blue-500', category: 'work', visible: true, createdById: owner.id }
  })
  const meetingType = await prisma.calendarType.create({
    data: { name: 'staff_meeting', label: 'Staff Meetings', color: 'bg-emerald-500', category: 'work', visible: true, createdById: owner.id }
  })

  await prisma.calendarEvent.create({
    data: {
      title: 'Morning Shift \u2014 Kitchen & Floor',
      description: 'Opening duties: clean tables, prep mise en place, open at 10:00.',
      typeId: shiftType.id,
      startDate: new Date(new Date().setHours(10, 0, 0, 0)),
      endDate: new Date(new Date().setHours(15, 0, 0, 0)),
      createdById: owner.id,
      assignments: { create: [{ employeeId: emp1.id }, { employeeId: emp2.id }] }
    }
  })

  await prisma.calendarEvent.create({
    data: {
      title: 'Evening Shift \u2014 Service & Close',
      description: 'Peak service (18:00\u201321:00), closing duties, cash reconciliation.',
      typeId: shiftType.id,
      startDate: new Date(new Date().setHours(17, 0, 0, 0)),
      endDate: new Date(new Date().setHours(23, 0, 0, 0)),
      createdById: owner.id,
      assignments: { create: [{ employeeId: emp2.id }, { employeeId: emp3.id }] }
    }
  })

  const weeklyMeeting = await prisma.calendarEvent.create({
    data: {
      title: 'Weekly Team Meeting',
      description: 'Review last week performance, discuss this week targets and staff concerns.',
      typeId: meetingType.id,
      startDate: daysFromNow(2),
      endDate: new Date(daysFromNow(2).getTime() + 60 * 60 * 1000),
      createdById: owner.id,
      assignments: { create: [{ employeeId: emp1.id }, { employeeId: emp2.id }, { employeeId: emp3.id }] }
    }
  })

  for (const empId of [emp1.id, emp2.id, emp3.id]) {
    await prisma.calendarNotification.create({
      data: {
        eventId: weeklyMeeting.id,
        userId: empId,
        notificationType: 'reminder',
        message: '\u23F0 Reminder: Weekly Team Meeting starts in 1 hour!',
        scheduledFor: new Date(daysFromNow(2).getTime() - 60 * 60 * 1000),
        isRead: false
      }
    })
  }
  console.log('\u2705 2 calendar types, 3 events, 5 assignments, 3 notifications created\n')

  // ===========================================================
  // 16. SPIN EVENT + REWARDS + EMPLOYEE SPINS
  // ===========================================================
  console.log('\u{1F3B0} Creating spin event, rewards and spins...')

  const spinEvent = await prisma.spinEvent.create({
    data: {
      name: 'Mid-Year Staff Appreciation Spin',
      description: 'Celebrating 6 months of excellent work! Each employee gets 1 spin.',
      startDate: new Date(),
      endDate: daysFromNow(30),
      isActive: true,
      createdById: owner.id
    }
  })

  await prisma.spinReward.create({ data: { name: '1 Extra Day Off', type: 'LEAVE', probability: 0.05, color: 'gold', icon: '\u{1F31F}', isActive: true, order: 1, maxQuantity: 3, currentQuantity: 0, eventId: spinEvent.id } })
  await prisma.spinReward.create({ data: { name: 'Cash Bonus 500,000 VND', type: 'CASH', value: '500000', probability: 0.15, color: 'green', icon: '\u{1F4B5}', isActive: true, order: 2, maxQuantity: 10, currentQuantity: 0, eventId: spinEvent.id } })
  await prisma.spinReward.create({ data: { name: 'Meal Voucher 200,000 VND', type: 'VOUCHER', value: '200000', probability: 0.30, color: 'blue', icon: '\u{1F35C}', isActive: true, order: 3, maxQuantity: 20, currentQuantity: 0, eventId: spinEvent.id } })
  await prisma.spinReward.create({ data: { name: 'Thank You Gift Set', type: 'GIFT', probability: 0.25, color: 'orange', icon: '\u{1F381}', isActive: true, order: 4, maxQuantity: 15, currentQuantity: 0, eventId: spinEvent.id } })
  await prisma.spinReward.create({ data: { name: 'Better Luck Next Time!', type: 'CONSOLATION', probability: 0.25, color: 'gray', icon: '\u{1F340}', isActive: true, order: 5, eventId: spinEvent.id } })

  for (const empId of [emp1.id, emp2.id, emp3.id]) {
    await prisma.employeeSpin.create({
      data: {
        employeeId: empId,
        eventId: spinEvent.id,
        createdById: owner.id,
        status: 'PENDING',
        notes: 'Granted for excellent Q2 performance review.'
      }
    })
  }
  console.log('\u2705 1 spin event, 5 rewards, 3 employee spins created\n')

  // ===========================================================
  // 17. TASKS + TASK COMMENTS
  // ===========================================================
  console.log('\u2705 Creating tasks and comments...')

  const task1 = await prisma.task.create({
    data: {
      title: 'Restock bar supplies \u2014 beer, wine and soft drinks',
      description: 'Inventory check showed Saigon Beer (12 cans low), Red Wine (3 bottles low), Lavie Water (24 bottles low). Arrange restocking by 3 PM today.',
      status: 'in_progress',
      category: 'Improvement',
      priority: 'Critical',
      dueDate: hoursFromNow(6),
      assignedToId: emp2.id,
      createdById: owner.id
    }
  })
  await prisma.taskComment.create({
    data: { taskId: task1.id, content: 'Called supplier at 10:30 AM. Delivery confirmed for 2 PM today. Will update when stock arrives.', createdById: emp2.id }
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Deep clean kitchen \u2014 after dinner service',
      description: 'Thorough deep clean of all cooking surfaces, fryers, grills and floors after service closes. Check and refill all mise en place for tomorrow morning.',
      status: 'todo',
      category: 'Improvement',
      priority: 'Important',
      dueDate: hoursFromNow(12),
      assignedToId: emp3.id,
      createdById: owner.id
    }
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Update QR code menu \u2014 add new summer dish photos',
      description: 'Upload high-quality photos for the 4 new summer dishes. Verify they display correctly on both guest menu and admin panel.',
      status: 'completed',
      category: 'Feature',
      priority: 'Important',
      assignedToId: emp1.id,
      createdById: owner.id
    }
  })
  await prisma.taskComment.create({
    data: { taskId: task3.id, content: 'All 4 dish photos uploaded and verified. Thumbnails look great on mobile. Done! \u2705', createdById: emp1.id }
  })
  await prisma.taskComment.create({
    data: { taskId: task3.id, content: 'Confirmed, images look perfect on guest menu. Great work Mai!', createdById: owner.id }
  })

  await prisma.task.create({
    data: {
      title: 'Fix table 3 \u2014 chair wobble complaint from guest',
      description: 'Guest at table 3 reported one chair is unstable. Check all 4 chairs and tighten screws. If cannot be fixed, swap with storage ones.',
      status: 'todo',
      category: 'Bug',
      priority: 'Normal',
      assignedToId: emp2.id,
      createdById: emp1.id
    }
  })

  console.log('\u2705 4 tasks + 3 task comments created\n')

  // ===========================================================
  // 18. CONVERSATIONS + MESSAGES + REACTIONS + READ RECEIPTS
  // ===========================================================

  // ===========================================================
  // EXTRA: TaskAttachment + ConversationPin + MessageAttachment
  //        (covers all remaining non-runtime models)
  // ===========================================================
  console.log('\u{1F4CE} Creating task attachment, conversation pin, message attachment...')

  // TaskAttachment — a PDF attached to task3 (the menu update task)
  await prisma.taskAttachment.create({
    data: {
      taskId: task3.id,
      fileName: 'summer-menu-photo-guidelines.pdf',
      filePath: '/uploads/tasks/summer-menu-photo-guidelines.pdf',
      fileSize: 245760, // ~240 KB
      mimeType: 'application/pdf',
      uploadedById: emp1.id
    }
  })

  console.log('\u2705 TaskAttachment created\n')

  console.log('\u{1F4AC} Creating conversations, messages, reactions...')

  const staffChat = await prisma.conversation.create({
    data: {
      type: 'group',
      name: '\u{1F35C} Big Boy Staff \u2014 All Hands',
      createdById: owner.id,
      participants: {
        create: [
          { accountId: owner.id },
          { accountId: emp1.id },
          { accountId: emp2.id },
          { accountId: emp3.id }
        ]
      }
    }
  })

  const msg1 = await prisma.message.create({
    data: {
      conversationId: staffChat.id,
      senderId: owner.id,
      content: 'Good morning team! \u{1F31E} Today we have a corporate group of 15 coming for lunch at 12:30. Please make sure table 5 is ready by 12:00. Mai, can you take lead on their service?'
    }
  })
  const msg2 = await prisma.message.create({
    data: {
      conversationId: staffChat.id,
      senderId: emp1.id,
      content: 'Good morning! Understood, I\u2019ll get table 5 set up by 11:45. Should I prepare the fixed menu or let them order \u00e0 la carte?',
      replyToId: msg1.id
    }
  })
  const msg3 = await prisma.message.create({
    data: {
      conversationId: staffChat.id,
      senderId: owner.id,
      content: '\u00c0 la carte please, they have specific preferences. Menu shared in the email. H\u00f9ng and Hoa, please assist Mai during the lunch rush. \u{1F4AA}'
    }
  })
  const msg4 = await prisma.message.create({
    data: {
      conversationId: staffChat.id,
      senderId: emp2.id,
      content: 'Got it! Already restocked the bar. Beer delivery confirmed for 2 PM. \u{1F37A}'
    }
  })
  const msg5 = await prisma.message.create({
    data: {
      conversationId: staffChat.id,
      senderId: emp3.id,
      content: 'On it! Will prep the garnishes and set up the welcome drinks. \u{1F33F}'
    }
  })

  await prisma.messageReaction.create({ data: { messageId: msg1.id, accountId: emp1.id, emoji: '\u{1F44D}' } })
  await prisma.messageReaction.create({ data: { messageId: msg1.id, accountId: emp2.id, emoji: '\u{1F44D}' } })
  await prisma.messageReaction.create({ data: { messageId: msg1.id, accountId: emp3.id, emoji: '\u{1F4AA}' } })
  await prisma.messageReaction.create({ data: { messageId: msg3.id, accountId: emp1.id, emoji: '\u2705' } })
  await prisma.messageReaction.create({ data: { messageId: msg4.id, accountId: owner.id, emoji: '\u{1F64C}' } })

  const allMessages = [msg1, msg2, msg3, msg4, msg5]
  const allStaff = [owner, emp1, emp2, emp3]
  for (const msg of allMessages) {
    for (const staff of allStaff) {
      if (msg.senderId !== staff.id) {
        await prisma.messageReadReceipt.create({ data: { messageId: msg.id, accountId: staff.id } })
      }
    }
  }

  const directChat = await prisma.conversation.create({
    data: {
      type: 'direct',
      createdById: owner.id,
      participants: { create: [{ accountId: owner.id }, { accountId: emp1.id }] }
    }
  })

  const dMsg1 = await prisma.message.create({
    data: {
      conversationId: directChat.id,
      senderId: owner.id,
      content: 'Mai, your performance this quarter has been outstanding. I\u2019m planning to discuss a promotion at next week\u2019s meeting. Well deserved! \u{1F31F}'
    }
  })
  const dMsg2 = await prisma.message.create({
    data: {
      conversationId: directChat.id,
      senderId: emp1.id,
      content: 'Thank you so much, Anh Minh! I\u2019m really grateful. I love working here and will keep doing my best \u{1F64F}'
    }
  })
  await prisma.messageReaction.create({ data: { messageId: dMsg1.id, accountId: emp1.id, emoji: '\u2764\uFE0F' } })
  await prisma.messageReadReceipt.create({ data: { messageId: dMsg1.id, accountId: emp1.id } })
  await prisma.messageReadReceipt.create({ data: { messageId: dMsg2.id, accountId: owner.id } })

  // ConversationPin — owner pins the group staff chat
  await prisma.conversationPin.create({
    data: {
      conversationId: staffChat.id,
      accountId: owner.id
    }
  })

  // MessageAttachment — emp1 shares a file in the staff chat
  const fileMsg = await prisma.message.create({
    data: {
      conversationId: staffChat.id,
      senderId: emp1.id,
      content: 'Here is the corporate group menu for today lunch \u{1F4C4}',
      type: 'file'
    }
  })
  await prisma.messageAttachment.create({
    data: {
      messageId: fileMsg.id,
      fileName: 'corporate-group-lunch-menu.pdf',
      filePath: '/uploads/messages/corporate-group-lunch-menu.pdf',
      fileSize: 512000, // ~500 KB
      mimeType: 'application/pdf'
    }
  })

  console.log('\u2705 ConversationPin + MessageAttachment created\n')


  console.log('\u2705 2 conversations, 7 messages, 6 reactions, read receipts created\n')

  // ===========================================================
  // DONE!
  // ===========================================================
  console.log('='.repeat(60))
  console.log('\u{1F389} BIG BOY RESTAURANT \u2014 PRODUCTION SEED COMPLETE!')
  console.log('='.repeat(60))
  console.log(`
\u{1F4CA} Database Summary:
  \u{1F464} Accounts:         4  (1 Owner + 3 Employees)
  \u{1F3F7}\uFE0F  DishCategories:  7
  \u{1F37D}\uFE0F  Dishes:         ${dishes.length}
  \u{1F4F8} DishSnapshots:  ${dishSnapshots.length}
  \u{1FA91} Tables:          ${tables.length}
  \u{1F464} Guests:          5
  \u{1F3F7}\uFE0F  Coupons:         3
  \u{1F6D2} Orders:          8  (3 Paid, 2 Delivered, 1 Processing, 2 Pending)
  \u{1F4B3} Payments:        4  (Cash, VNPay, Stripe, YooKassa)
  \u{1F3AB} CouponUsages:    1
  \u2B50 Reviews:          5  (all VISIBLE)
  \u{1F4DD} BlogPosts:       2  (all PUBLISHED)
  \u2699\uFE0F  Settings:        14
  \u2753 FAQs:            16
  \u{1F4C5} CalendarTypes:   2
  \u{1F4C5} CalendarEvents:  3
  \u{1F465} EventAssign:     5
  \u{1F514} Notifications:   3
  \u{1F3B0} SpinEvent:       1
  \u{1F3C6} SpinRewards:     5
  \u{1F3A1} EmployeeSpins:   3  (all PENDING)
  \u2705 Tasks:           4
  \u{1F4AC} TaskComments:    4
  \u{1F4AC} Conversations:   2  (1 group, 1 direct)
  \u{1F4E8} Messages:        8  (7 text + 1 file)
  \u{1F44D} Reactions:       6\n  \u{1F4CE} TaskAttachments: 1\n  \u{1F4CE} MsgAttachments:  1\n  \u{1F4CC} ConvPins:        1

\u{1F510} Admin Login:
  Email:    admin@order.com
  Password: 123456

\u{1F468}\u200D\u{1F4BC} Employee Logins:
  mai@bigboy.vn    / emp123
  hung@bigboy.vn   / emp123
  hoa@bigboy.vn    / emp123

\u{1F3F7}\uFE0F  Active Coupons:
  WELCOME10  \u2014 10% off (min $10)
  BIGBOY50   \u2014 $5 off (min $20)
  SUMMER25   \u2014 25% off (min $30)
`)
}

main()
  .catch((e) => {
    console.error('\u274C Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
