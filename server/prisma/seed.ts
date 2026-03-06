import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Seeding is not allowed in production environment.')
    return
  }

  console.log('Seeding Database...')

  // =========================================================================
  // CLEAR EXISTING DATA
  // We specify the order to maintain referential integrity (children first)
  // =========================================================================
  console.log('Clearing existing data...')

  await prisma.couponUsage.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.payment.deleteMany()

  await prisma.taskComment.deleteMany()
  await prisma.taskAttachment.deleteMany()
  await prisma.task.deleteMany()

  await prisma.messageReaction.deleteMany()
  await prisma.messageReadReceipt.deleteMany()
  await prisma.messageAttachment.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.conversationPin.deleteMany()
  await prisma.conversation.deleteMany()

  await prisma.calendarEventAssignment.deleteMany()
  await prisma.calendarNotification.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.calendarType.deleteMany()

  await prisma.employeeSpin.deleteMany()
  await prisma.spinReward.deleteMany()
  await prisma.spinEvent.deleteMany()

  await prisma.blogPost.deleteMany()

  await prisma.coupon.deleteMany()
  await prisma.review.deleteMany()
  await prisma.fcmToken.deleteMany()
  await prisma.socket.deleteMany()
  await prisma.refreshToken.deleteMany()

  await prisma.dishSnapshot.deleteMany()
  await prisma.dish.deleteMany()
  await prisma.dishCategory.deleteMany()

  await prisma.guest.deleteMany()
  await prisma.table.deleteMany()

  await prisma.account.deleteMany()

  // =========================================================================
  // SEED DATA
  // =========================================================================

  console.log('Creating Accounts...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.account.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'Owner'
    }
  })

  const employee1 = await prisma.account.create({
    data: {
      name: 'Alice Employee',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'Employee',
      ownerId: admin.id
    }
  })

  const employee2 = await prisma.account.create({
    data: {
      name: 'Bob Employee',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'Employee',
      ownerId: admin.id
    }
  })

  console.log('Creating Tables...')
  const table1 = await prisma.table.create({ data: { capacity: 2, token: 'tbl-token-1', number: 1 } })
  const table2 = await prisma.table.create({ data: { capacity: 4, token: 'tbl-token-2', number: 2 } })
  const table3 = await prisma.table.create({ data: { capacity: 6, token: 'tbl-token-3', number: 3 } })

  console.log('Creating Dish Categories...')
  const categories = [
    { name: 'Appetizers', description: 'Delicious appetizer dishes' },
    { name: 'Main Courses', description: 'Hearty main course dishes' },
    { name: 'Desserts', description: 'Sweet dessert treats' },
    { name: 'Beverages', description: 'Refreshing drinks' },
    { name: 'Sides', description: 'Variety of side dishes' }
  ]
  for (const c of categories) {
    await prisma.dishCategory.create({ data: c })
  }

  console.log('Creating Dishes and Snapshots...')
  const dishData = [
    {
      name: 'Spring Rolls',
      price: 2,
      description: 'Crispy rolls with vegetables and pork',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Rice paper, pork, carrots, wood ear mushrooms, glass noodles',
      allergens: 'None',
      tags: 'Fried, Traditional'
    },
    {
      name: 'Garlic Bread',
      price: 1.5,
      description: 'Toasted baguette with garlic butter and herbs',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Baguette, butter, garlic, parsley',
      allergens: 'Dairy, Gluten',
      tags: 'Snack, Western'
    },
    {
      name: 'Chicken Wings',
      price: 3,
      description: 'Spicy glazed chicken wings with ranch dip',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Chicken wings, fish sauce, garlic, chili',
      allergens: 'None',
      tags: 'Spicy, Finger Food'
    },
    {
      name: 'Bruschetta',
      price: 2.5,
      description: 'Grilled bread topped with tomatoes and basil',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Toasted bread, tomatoes, basil, olive oil, garlic',
      allergens: 'Gluten',
      tags: 'Snack, Italian Appetizer, Vegetarian'
    },
    {
      name: 'Calamari Rings',
      price: 3.5,
      description: 'Deep-fried squid rings with tartar sauce',
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Squid, crispy batter, pepper, tartar sauce',
      allergens: 'Seafood, Gluten, Egg',
      tags: 'Seafood, Deep Fried'
    },
    {
      name: 'Cheese Sticks',
      price: 2.5,
      description: 'Fried mozzarella sticks with marinara',
      image: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Mozzarella cheese, breadcrumbs, marinara sauce',
      allergens: 'Dairy, Gluten',
      tags: 'Cheese, Snack'
    },
    {
      name: 'Nachos Supreme',
      price: 4,
      description: 'Tortilla chips with cheese, jalapenos, and beef',
      image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Tortilla chips, minced beef, cheddar cheese, jalapenos, salsa',
      allergens: 'Dairy, Gluten',
      tags: 'Mexican, Mildly Spicy, Sharable'
    },
    {
      name: 'Shrimp Cocktail',
      price: 4.5,
      description: 'Chilled shrimp with tangy cocktail sauce',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Fresh shrimp, lemon, tangy cocktail sauce',
      allergens: 'Seafood',
      tags: 'Seafood, Refreshing'
    },
    {
      name: 'Onion Rings',
      price: 2,
      description: 'Crispy battered onion rings',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Onions, crispy batter, spices',
      allergens: 'Gluten',
      tags: 'Fried, Vegetarian, Snack'
    },
    {
      name: 'Stuffed Mushrooms',
      price: 3,
      description: 'Mushrooms stuffed with cheese and herbs',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
      category: 'Appetizers',
      status: 'Available',
      ingredients: 'Button mushrooms, parmesan cheese, garlic, parsley, breadcrumbs',
      allergens: 'Dairy, Gluten',
      tags: 'Vegetarian, Healthy, Baked'
    },
    {
      name: 'Grilled Ribeye Steak',
      price: 14,
      description: 'Premium beef steak with mashed potatoes',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Ribeye beef, potatoes, butter, salt and pepper, garlic',
      allergens: 'Dairy',
      tags: 'Premium, Grilled, Western'
    },
    {
      name: 'Salmon Fillet',
      price: 12,
      description: 'Pan-seared salmon with asparagus and lemon butter',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Salmon, asparagus, butter, lemon, dill',
      allergens: 'Seafood, Dairy',
      tags: 'Healthy, Fish'
    },
    {
      name: 'Chicken Alfredo',
      price: 6,
      description: 'Fettuccine pasta with creamy parmesan chicken',
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Fettuccine pasta, chicken breast, heavy cream, parmesan cheese, garlic',
      allergens: 'Dairy, Gluten',
      tags: 'Pasta, Creamy'
    },
    {
      name: 'Margherita Pizza',
      price: 5,
      description: 'Classic pizza with fresh mozzarella and basil',
      image: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Pizza crust, tomato sauce, fresh mozzarella cheese, basil',
      allergens: 'Dairy, Gluten',
      tags: 'Pizza, Traditional Italian, Vegetarian'
    },
    {
      name: 'Beef Burger',
      price: 5.5,
      description: 'Juicy beef patty with cheese, lettuce, and fries',
      image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Burger bun, ground beef, cheddar cheese, lettuce, tomatoes, french fries',
      allergens: 'Dairy, Gluten',
      tags: 'Burger, Savory'
    },
    {
      name: 'BBQ Pork Ribs',
      price: 10,
      description: 'Slow-cooked ribs with smoky BBQ sauce',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Pork ribs, BBQ sauce, honey, black pepper',
      allergens: 'None',
      tags: 'Grilled Meat, Main'
    },
    {
      name: 'Vegetarian Lasagna',
      price: 6,
      description: 'Layered pasta with roasted vegetables and cheese',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Lasagna sheets, eggplant, mushrooms, tomato sauce, mozzarella cheese',
      allergens: 'Gluten, Dairy',
      tags: 'Vegetarian, Traditional, Oven Baked'
    },
    {
      name: 'Pad Thai',
      price: 4.5,
      description: 'Thai stir-fried rice noodles with shrimp and peanuts',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Thai rice noodles, fresh shrimp, roasted peanuts, bean sprouts, tamarind, stir-fried egg',
      allergens: 'Peanuts, Seafood, Egg, Gluten',
      tags: 'Mildly Spicy, Exotic, Best Seller'
    },
    {
      name: 'Chicken Tikka Masala',
      price: 7,
      description: 'Spicy Indian chicken curry with basmati rice',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Chicken, spicy tomato sauce, masala spices, basmati rice, yogurt',
      allergens: 'Dairy',
      tags: 'Indian, Spicy, Curry'
    },
    {
      name: 'Fish and Chips',
      price: 6,
      description: 'Crispy battered cod with thick-cut fries',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Cod fish, crispy batter, potatoes, tartar sauce',
      allergens: 'Seafood, Gluten, Egg',
      tags: 'British, Deep Fried'
    },
    {
      name: 'Beef Noodle Soup',
      price: 3,
      description: 'Traditional Vietnamese Pho with rare beef',
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Pho noodles, rare beef, beef bone broth, cardamom, cinnamon, star anise, scallions',
      allergens: 'None',
      tags: 'Vietnamese Specialty, Best Seller, Breakfast'
    },
    {
      name: 'Grilled Pork Rice',
      price: 2.5,
      description: 'Broken rice with grilled pork chop and egg',
      image: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Broken rice, grilled pork chop, sunny-side-up egg, scallion oil, fish sauce',
      allergens: 'Egg, Soy',
      tags: 'Saigon Specialty, Casual, Tasty'
    },
    {
      name: 'Spaghetti Bolognese',
      price: 5.5,
      description: 'Classic Italian meat sauce pasta',
      image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Spaghetti, ground beef, tomato sauce, onions, herbs, cheese',
      allergens: 'Gluten, Dairy',
      tags: 'Pasta, Traditional, Kid Friendly'
    },
    {
      name: 'Mushroom Risotto',
      price: 7,
      description: 'Creamy Arborio rice with wild mushrooms',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Arborio rice, wild mushrooms, vegetable broth, heavy cream, parmesan cheese',
      allergens: 'Dairy',
      tags: 'Italian, Creamy, Vegetarian'
    },
    {
      name: 'Roast Duck',
      price: 9,
      description: 'Crispy skin roast duck with hoisin sauce',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category: 'Main Courses',
      status: 'Available',
      ingredients: 'Roasted duck with mac mat leaves, crispy skin, hoisin sauce, ginger',
      allergens: 'Soy',
      tags: 'Roasted, Savory, Delicacy'
    },
    {
      name: 'Tiramisu',
      price: 3.5,
      description: 'Classic Italian coffee-flavored dessert',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Ladyfingers, espresso coffee, mascarpone cheese, cocoa powder, rum',
      allergens: 'Dairy, Gluten, Egg',
      tags: 'Dessert, Italian, Coffee Flavor'
    },
    {
      name: 'Cheesecake',
      price: 4,
      description: 'New York style cheesecake with strawberry topping',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Cream cheese, butter cookie crust, eggs, lemon juice, strawberry jam',
      allergens: 'Dairy, Gluten, Egg',
      tags: 'Rich, Sweet, New York'
    },
    {
      name: 'Chocolate Lava Cake',
      price: 4,
      description: 'Warm chocolate cake with molten center',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Dark chocolate, butter, eggs, sugar, flour, vanilla ice cream',
      allergens: 'Dairy, Gluten, Egg',
      tags: 'Chocolate, Molten, Sweet'
    },
    {
      name: 'Ice Cream Sundae',
      price: 2.5,
      description: 'Vanilla ice cream with chocolate syrup and nuts',
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Vanilla ice cream, chocolate syrup, crushed roasted peanuts, cherries',
      allergens: 'Dairy, Peanuts',
      tags: 'Ice Cream, Cold, Kid Friendly'
    },
    {
      name: 'Panna Cotta',
      price: 3,
      description: 'Creamy Italian dessert with mixed berries',
      image: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Heavy cream, fresh milk, gelatin, sugar, mixed berry jam',
      allergens: 'Dairy',
      tags: 'Soft Dessert, Italian, Fruity'
    },
    {
      name: 'Apple Pie',
      price: 3.5,
      description: 'Traditional pie with cinnamon apples and crust',
      image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Fresh apples, cinnamon powder, brown sugar, buttery puff pastry',
      allergens: 'Gluten, Dairy',
      tags: 'Traditional Western, Baked, Warm'
    },
    {
      name: 'Matcha Mille Crepe',
      price: 4.5,
      description: 'Layered green tea crepe cake',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Japanese matcha powder, flour, milk, eggs, whipped cream',
      allergens: 'Gluten, Dairy, Egg',
      tags: 'Japanese, Green Tea, Cake'
    },
    {
      name: 'Creme Brulee',
      price: 3.5,
      description: 'Rich custard base topped with hardened caramelized sugar',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Egg yolks, heavy cream, vanilla, torched caramelized sugar crust',
      allergens: 'Dairy, Egg',
      tags: 'Luxurious, French, Rich'
    },
    {
      name: 'Fruit Tart',
      price: 3,
      description: 'Sweet pastry crust filled with custard and fresh fruits',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Sweet tart crust, custard cream, strawberries, kiwi, fresh grapes',
      allergens: 'Gluten, Dairy, Egg',
      tags: 'Tropical Fruit, Refreshing'
    },
    {
      name: 'Coconut Flan',
      price: 2.5,
      description: 'Caramel custard with a hint of coconut',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      category: 'Desserts',
      status: 'Available',
      ingredients: 'Eggs, condensed milk, coconut milk, caramel sugar',
      allergens: 'Egg, Dairy',
      tags: 'Flan, Sweet, Casual'
    },
    {
      name: 'Iced Milk Coffee',
      price: 1.5,
      description: 'Traditional Vietnamese drip coffee with condensed milk',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Pure coffee, drip filter, sweetened condensed milk, ice cubes',
      allergens: 'Dairy',
      tags: 'Vietnamese Coffee, Energizing, Best Seller'
    },
    {
      name: 'Peach Tea',
      price: 2,
      description: 'Refreshing black tea with peach slices',
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Black tea, peach syrup, sliced peaches, ice, lemongrass',
      allergens: 'None',
      tags: 'Fruit Tea, Refreshing, Cold'
    },
    {
      name: 'Mango Smoothie',
      price: 2.5,
      description: 'Blended fresh mango with milk',
      image: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Fresh ripe mango, fresh milk, condensed milk, blended ice',
      allergens: 'Dairy',
      tags: 'Smoothie, Sweet, Nutritious'
    },
    {
      name: 'Fresh Orange Juice',
      price: 2,
      description: 'Freshly squeezed oranges',
      image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Pure squeezed oranges, sugar (optional), ice',
      allergens: 'None',
      tags: 'Juice, Fruit, Healthy'
    },
    {
      name: 'Matcha Latte',
      price: 2,
      description: 'Green tea powder with steamed milk',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Japanese Matcha powder, pasteurized fresh milk, sugar',
      allergens: 'Dairy',
      tags: 'Green Tea, Warm/Cold, Milky'
    },
    {
      name: 'Coca Cola',
      price: 1,
      description: 'Classic soda',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Cola-flavored carbonated soft drink',
      allergens: 'None',
      tags: 'Soft Drink, Refreshing'
    },
    {
      name: 'Lemonade',
      price: 1.5,
      description: 'Freshly squeezed lemon with syrup and mint',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Lemon juice, sugar syrup, mint leaves, ice, soda',
      allergens: 'None',
      tags: 'Sweet and Sour, Cool, Refresher'
    },
    {
      name: 'Craft Beer',
      price: 3.5,
      description: 'Local pale ale beer',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Pale Ale craft beer, golden barley',
      allergens: 'Gluten',
      tags: 'Beer, Alcoholic, Social'
    },
    {
      name: 'Red Wine Glass',
      price: 5,
      description: 'House red wine',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Cabernet Sauvignon red wine by the glass',
      allergens: 'None',
      tags: 'Alcoholic, Red Wine, Premium'
    },
    {
      name: 'Mineral Water',
      price: 1,
      description: 'Bottled natural spring water',
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80',
      category: 'Beverages',
      status: 'Available',
      ingredients: 'Purified spring water',
      allergens: 'None',
      tags: 'Water, Basic'
    },
    {
      name: 'French Fries',
      price: 2,
      description: 'Crispy shoestring potatoes',
      image: 'https://images.unsplash.com/photo-1484723091791-009251d29641?auto=format&fit=crop&w=400&q=80',
      category: 'Sides',
      status: 'Available',
      ingredients: 'Shoestring potatoes, vegetable oil, sea salt, ketchup',
      allergens: 'None',
      tags: 'Side, Fried, Kid Friendly'
    },
    {
      name: 'Mashed Potatoes',
      price: 2,
      description: 'Creamy buttery potatoes',
      image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80',
      category: 'Sides',
      status: 'Available',
      ingredients: 'Mashed potatoes, unsalted butter, fresh milk, black pepper',
      allergens: 'Dairy',
      tags: 'Side, Creamy, Smooth'
    },
    {
      name: 'Steamed Vegetables',
      price: 2,
      description: 'Seasonal broccoli, carrots, and cauliflower',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
      category: 'Sides',
      status: 'Available',
      ingredients: 'Broccoli, carved carrots, cauliflower, steamed with sesame salt',
      allergens: 'None',
      tags: 'Vegetarian, Nutritious, Healthy'
    },
    {
      name: 'Garlic Fried Rice',
      price: 1.5,
      description: 'Wok-fried rice with crispy garlic',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category: 'Sides',
      status: 'Available',
      ingredients: 'Wok-fried white rice, crispy fried garlic, scrambled egg, scallions',
      allergens: 'Egg',
      tags: 'Filling, Traditional, Oily'
    },
    {
      name: 'Side Salad',
      price: 2,
      description: 'Mixed greens with balsamic vinaigrette',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
      category: 'Sides',
      status: 'Available',
      ingredients: 'Mixed green and purple lollo rosso lettuce, cherry tomatoes, cucumber, balsamic vinegar dressing',
      allergens: 'None',
      tags: 'Salad, Refreshing, Diet'
    }
  ]

  const dishes = []
  const dishSnapshots = []
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
        ingredients: d.ingredients || '',
        allergens: d.allergens || 'None',
        tags: d.tags || '',
        dishId: d.id
      }
    })
    dishes.push(d)
    dishSnapshots.push(snap)
  }

  console.log('Creating Guests...')
  const guest1 = await prisma.guest.create({
    data: {
      name: 'John Doe',
      tableNumber: table1.number
    }
  })

  const guest2 = await prisma.guest.create({
    data: {
      name: 'Jane Smith',
      tableNumber: table2.number
    }
  })

  console.log('Creating Coupons...')
  const couponFixed = await prisma.coupon.create({
    data: {
      code: 'DISCOUNT50',
      discountType: 'FIXED_AMOUNT',
      discountValue: 2,
      minOrderAmount: 5,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: 'ACTIVE',
      createdById: admin.id,
      maxTotalUsage: 100,
      usageCount: 0
    }
  })

  const couponPercent = await prisma.coupon.create({
    data: {
      code: 'SUMMER20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: 'ACTIVE',
      createdById: admin.id,
      maxTotalUsage: 50,
      usageCount: 0
    }
  })

  console.log('Creating Orders and Order Items...')
  const order1 = await prisma.order.create({
    data: {
      guestId: guest1.id,
      tableNumber: table1.number,
      totalAmount: 5, // $2 + $3
      status: 'Paid',
      orderHandlerId: employee1.id,
      items: {
        create: [
          { dishSnapshotId: dishSnapshots[0].id, quantity: 1, unitPrice: 2, totalPrice: 2 },
          { dishSnapshotId: dishSnapshots[2].id, quantity: 1, unitPrice: 3, totalPrice: 3 }
        ]
      }
    }
  })

  const order2 = await prisma.order.create({
    data: {
      guestId: guest2.id,
      tableNumber: table2.number,
      totalAmount: 3.2, // ($1.5 + $2.5) - $0.8 discount (20%)
      status: 'Pending',
      orderHandlerId: employee2.id,
      couponId: couponPercent.id,
      discountAmount: 0.8,
      items: {
        create: [
          { dishSnapshotId: dishSnapshots[1].id, quantity: 1, unitPrice: 1.5, totalPrice: 1.5 },
          { dishSnapshotId: dishSnapshots[3].id, quantity: 1, unitPrice: 2.5, totalPrice: 2.5 }
        ]
      }
    }
  })

  console.log('Creating Payments...')
  await prisma.payment.create({
    data: {
      guestId: guest1.id,
      amount: 5,
      paymentMethod: 'Cash',
      status: 'Paid',
      transactionRef: 'TRX-' + Date.now(),
      paymentHandlerId: employee1.id,
      tableNumber: table1.number,
      orders: {
        connect: [{ id: order1.id }]
      }
    }
  })

  // Update order1 with the payment via relation update
  const payment1 = await prisma.payment.findFirst({ where: { orders: { some: { id: order1.id } } } })
  if (payment1) {
    await prisma.order.update({
      where: { id: order1.id },
      data: { paymentId: payment1.id }
    })
  }

  console.log('Creating Reviews...')
  await prisma.review.create({
    data: {
      guestId: guest1.id,
      overallRating: 5,
      foodQuality: 5,
      serviceQuality: 5,
      ambiance: 4,
      priceValue: 5,
      comment: 'Excellent, the food is very delicious',
      status: 'VISIBLE',
      approvedBy: admin.id,
      approvedAt: new Date()
    }
  })

  console.log('Creating Blog Posts...')
  await prisma.blogPost.create({
    data: {
      title: 'Grand opening of new branch',
      slug: 'grand-opening-new-branch',
      excerpt: 'We are very excited to announce the opening of a new branch...',
      content: '# Grand opening of new branch \n\n In District 1, HCMC...',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date()
    }
  })

  await prisma.blogPost.create({
    data: {
      title: 'New dishes this summer',
      slug: 'new-dishes-this-summer',
      excerpt: 'What is hot this summer?',
      content: '# New dishes this summer \n\n Try our super cool Bun Cha now...',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date()
    }
  })

  console.log('Creating Calendars and Events...')
  const shiftCalendar = await prisma.calendarType.create({
    data: {
      name: 'work_shift',
      label: 'Work Schedule',
      category: 'work',
      createdById: admin.id
    }
  })

  const event1 = await prisma.calendarEvent.create({
    data: {
      title: 'Morning Shift',
      typeId: shiftCalendar.id,
      startDate: new Date(new Date().setHours(8, 0, 0, 0)),
      endDate: new Date(new Date().setHours(16, 0, 0, 0)),
      createdById: admin.id,
      assignments: {
        create: [{ employeeId: employee1.id }]
      }
    }
  })

  console.log('Creating Tasks...')
  const task1 = await prisma.task.create({
    data: {
      title: 'Clean up table area 2',
      description: 'The customers just left, please clean table 2.',
      category: 'Improvement',
      status: 'todo',
      priority: 'normal',
      assignedToId: employee2.id,
      createdById: admin.id
    }
  })

  console.log('Creating Conversations & Messages...')
  const convo = await prisma.conversation.create({
    data: {
      type: 'group',
      name: 'Full Time Employees',
      createdById: admin.id,
      participants: {
        create: [{ accountId: admin.id }, { accountId: employee1.id }, { accountId: employee2.id }]
      }
    }
  })

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: admin.id,
      content: 'Good morning everyone!'
    }
  })

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: employee1.id,
      content: 'Hello boss!'
    }
  })

  console.log('Creating Spin Events and Rewards...')
  const spinEvent = await prisma.spinEvent.create({
    data: {
      name: 'Lunar New Year Spin',
      description: 'For all employees',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      createdById: admin.id
    }
  })

  const reward1 = await prisma.spinReward.create({
    data: {
      name: '1 Extra Day Off',
      type: 'LEAVE',
      probability: 0.1,
      eventId: spinEvent.id,
      maxQuantity: 5,
      currentQuantity: 0
    }
  })

  const reward2 = await prisma.spinReward.create({
    data: {
      name: 'Voucher 500k',
      type: 'VOUCHER',
      probability: 0.3,
      eventId: spinEvent.id,
      maxQuantity: 20,
      currentQuantity: 0
    }
  })

  await prisma.employeeSpin.create({
    data: {
      employeeId: employee1.id,
      eventId: spinEvent.id,
      createdById: admin.id,
      status: 'PENDING'
    }
  })

  // ── Restaurant Settings ──────────────────────────────────────
  console.log('Creating Restaurant Settings...')
  await prisma.restaurantSetting.deleteMany()
  const settings = [
    { key: 'restaurant_name', value: 'QR Order Restaurant', label: 'Restaurant Name', group: 'general' },
    {
      key: 'opening_hours',
      value: 'Mon-Fri: 10:00 AM – 10:00 PM, Sat-Sun: 9:00 AM – 11:00 PM',
      label: 'Opening Hours',
      group: 'general'
    },
    {
      key: 'description',
      value:
        'A modern restaurant offering Vietnamese and Asian fusion cuisine with QR code ordering for a seamless dining experience.',
      label: 'Description',
      group: 'general'
    },
    { key: 'cuisine_type', value: 'Vietnamese & Asian Fusion', label: 'Cuisine Type', group: 'general' },
    { key: 'seating_capacity', value: '120 seats', label: 'Seating Capacity', group: 'general' },
    { key: 'wifi_password', value: 'QROrder2025', label: 'WiFi Password', group: 'general' },
    { key: 'phone', value: '+84 28 1234 5678', label: 'Phone Number', group: 'contact' },
    { key: 'email', value: 'contact@qrorder.vn', label: 'Email', group: 'contact' },
    {
      key: 'address',
      value: '123 Nguyen Hue Boulevard, District 1, Ho Chi Minh City, Vietnam',
      label: 'Address',
      group: 'contact'
    },
    { key: 'website', value: 'https://qrorder.vn', label: 'Website', group: 'contact' },
    {
      key: 'reservation_policy',
      value: 'Reservations accepted up to 7 days in advance. Walk-ins welcome based on availability.',
      label: 'Reservation Policy',
      group: 'policies'
    },
    {
      key: 'cancellation_policy',
      value: 'Free cancellation up to 2 hours before your reservation time.',
      label: 'Cancellation Policy',
      group: 'policies'
    },
    {
      key: 'payment_methods',
      value: 'Cash, Visa, Mastercard, Momo, ZaloPay, Bank Transfer',
      label: 'Payment Methods',
      group: 'policies'
    },
    {
      key: 'dress_code',
      value: 'Smart casual. No swimwear or sleeveless shirts for gentlemen.',
      label: 'Dress Code',
      group: 'policies'
    }
  ]
  for (const s of settings) {
    await prisma.restaurantSetting.create({ data: s })
  }

  // ── FAQ ──────────────────────────────────────────────────────
  console.log('Creating FAQs...')
  await prisma.fAQ.deleteMany()
  const faqs = [
    {
      question: 'What are your opening hours?',
      answer:
        'We are open Monday to Friday from 10:00 AM to 10:00 PM, and Saturday to Sunday from 9:00 AM to 11:00 PM.',
      category: 'general',
      sortOrder: 1
    },
    {
      question: 'Where are you located?',
      answer: 'We are located at 123 Nguyen Hue Boulevard, District 1, Ho Chi Minh City, Vietnam.',
      category: 'general',
      sortOrder: 2
    },
    {
      question: 'Do you have parking?',
      answer:
        'Yes, we have a dedicated parking lot behind the restaurant. Valet parking is also available on weekends.',
      category: 'general',
      sortOrder: 3
    },
    {
      question: 'Is there a dress code?',
      answer: 'We have a smart casual dress code. We kindly ask gentlemen to avoid swimwear or sleeveless shirts.',
      category: 'general',
      sortOrder: 4
    },
    {
      question: 'What is the WiFi password?',
      answer: 'Our WiFi password is QROrder2025. Connect to the "QR Order Guest" network.',
      category: 'general',
      sortOrder: 5
    },
    {
      question: 'Do you have vegetarian options?',
      answer:
        'Yes! We have a wide selection of vegetarian and vegan dishes. Look for items tagged as "Vegetarian" in our menu, or ask our AI assistant to search for vegetarian dishes.',
      category: 'menu',
      sortOrder: 1
    },
    {
      question: 'Do you cater to food allergies?',
      answer:
        'Yes, all our menu items list allergen information. Please inform your server or check the dish details in the app for specific allergens.',
      category: 'menu',
      sortOrder: 2
    },
    {
      question: 'Can I customize my order?',
      answer:
        'Absolutely! You can add special instructions when placing your order through the QR code system. For complex modifications, please speak with your server directly.',
      category: 'menu',
      sortOrder: 3
    },
    {
      question: 'Do you offer delivery?',
      answer:
        'Yes, we offer delivery through GrabFood, ShopeeFood, and our direct ordering system within a 10km radius.',
      category: 'delivery',
      sortOrder: 1
    },
    {
      question: 'What is the delivery fee?',
      answer:
        'Delivery fees vary by distance, typically between 15,000 – 30,000 VND. Orders over 500,000 VND enjoy free delivery.',
      category: 'delivery',
      sortOrder: 2
    },
    {
      question: 'How long does delivery take?',
      answer: 'Delivery typically takes 30 – 45 minutes depending on your location and order complexity.',
      category: 'delivery',
      sortOrder: 3
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash, Visa, Mastercard, Momo, ZaloPay, and Bank Transfer.',
      category: 'payment',
      sortOrder: 1
    },
    {
      question: 'Can I split the bill?',
      answer: 'Yes! Each person can scan the QR code and pay for their own items.',
      category: 'payment',
      sortOrder: 2
    },
    {
      question: 'How do I make a reservation?',
      answer:
        'You can make a reservation by calling us at +84 28 1234 5678, visiting our website, or using the reservation feature in our app.',
      category: 'reservation',
      sortOrder: 1
    },
    {
      question: 'Do you accept walk-ins?',
      answer:
        'Yes, walk-ins are welcome! During peak hours (12:00 – 1:30 PM and 6:30 – 8:30 PM), we recommend making a reservation.',
      category: 'reservation',
      sortOrder: 2
    },
    {
      question: 'Can I book for a large group?',
      answer:
        'Yes, we can accommodate groups up to 30 people. For groups larger than 10, please contact us at least 48 hours in advance.',
      category: 'reservation',
      sortOrder: 3
    }
  ]
  for (const f of faqs) {
    await prisma.fAQ.create({ data: f })
  }

  console.log('✅ Seeding completely finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
