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
      role: 'Owner',
    },
  })

  const employee1 = await prisma.account.create({
    data: {
      name: 'Alice Employee',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'Employee',
      ownerId: admin.id,
    },
  })

  const employee2 = await prisma.account.create({
    data: {
      name: 'Bob Employee',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'Employee',
      ownerId: admin.id,
    },
  })

  console.log('Creating Tables...')
  const table1 = await prisma.table.create({ data: { capacity: 2, token: 'tbl-token-1', number: 1 } })
  const table2 = await prisma.table.create({ data: { capacity: 4, token: 'tbl-token-2', number: 2 } })
  const table3 = await prisma.table.create({ data: { capacity: 6, token: 'tbl-token-3', number: 3 } })

  console.log('Creating Dishes and Snapshots...')
  const dishData = [
    { name: 'Beef Noodle Soup', price: 50000, description: 'Rare beef noodle soup', image: 'url1', category: 'Main Course', status: 'Available' },
    { name: 'Grilled Pork Noodle', price: 45000, description: 'Hanoi style grilled pork with rice noodle', image: 'url2', category: 'Main Course', status: 'Available' },
    { name: 'Fresh Spring Rolls', price: 20000, description: 'Shrimp and pork spring rolls', image: 'url3', category: 'Appetizer', status: 'Available' },
    { name: 'Iced Milk Coffee', price: 25000, description: 'Special signature coffee', image: 'url4', category: 'Beverage', status: 'Available' },
    { name: 'Iced Tea', price: 5000, description: 'Refreshing iced tea', image: 'url5', category: 'Beverage', status: 'Available' },
  ]
  
  const dishes = []
  const dishSnapshots = []
  for (const data of dishData) {
    const d = await prisma.dish.create({ data })
    const snap = await prisma.dishSnapshot.create({
      data: {
        name: d.name, price: d.price, description: d.description, image: d.image, category: d.category, status: d.status, dishId: d.id,
      }
    })
    dishes.push(d)
    dishSnapshots.push(snap)
  }

  console.log('Creating Guests...')
  const guest1 = await prisma.guest.create({
    data: {
      name: 'John Doe',
      tableNumber: table1.number,
    }
  })

  const guest2 = await prisma.guest.create({
    data: {
      name: 'Jane Smith',
      tableNumber: table2.number,
    }
  })

  console.log('Creating Coupons...')
  const couponFixed = await prisma.coupon.create({
    data: {
      code: 'DISCOUNT50',
      discountType: 'FIXED_AMOUNT',
      discountValue: 50000,
      minOrderAmount: 100000,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: 'ACTIVE',
      createdById: admin.id,
      maxTotalUsage: 100,
      usageCount: 0,
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
      usageCount: 0,
    }
  })

  console.log('Creating Orders and Order Items...')
  const order1 = await prisma.order.create({
    data: {
      guestId: guest1.id,
      tableNumber: table1.number,
      totalAmount: 70000, // 50000 + 20000
      status: 'Paid',
      orderHandlerId: employee1.id,
      items: {
        create: [
          { dishSnapshotId: dishSnapshots[0].id, quantity: 1, unitPrice: 50000, totalPrice: 50000 },
          { dishSnapshotId: dishSnapshots[2].id, quantity: 1, unitPrice: 20000, totalPrice: 20000 }
        ]
      }
    }
  })

  const order2 = await prisma.order.create({
    data: {
      guestId: guest2.id,
      tableNumber: table2.number,
      totalAmount: 70000, // (45000 + 25000) - 14000 discount
      status: 'Pending',
      orderHandlerId: employee2.id,
      couponId: couponPercent.id,
      discountAmount: 14000,
      items: {
        create: [
          { dishSnapshotId: dishSnapshots[1].id, quantity: 1, unitPrice: 45000, totalPrice: 45000 },
          { dishSnapshotId: dishSnapshots[3].id, quantity: 1, unitPrice: 25000, totalPrice: 25000 }
        ]
      }
    }
  })

  console.log('Creating Payments...')
  await prisma.payment.create({
    data: {
      guestId: guest1.id,
      amount: 70000,
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
        create: [
          { employeeId: employee1.id }
        ]
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
      createdById: admin.id,
    }
  })

  console.log('Creating Conversations & Messages...')
  const convo = await prisma.conversation.create({
    data: {
      type: 'group',
      name: 'Full Time Employees',
      createdById: admin.id,
      participants: {
        create: [
          { accountId: admin.id },
          { accountId: employee1.id },
          { accountId: employee2.id }
        ]
      }
    }
  })

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: admin.id,
      content: 'Good morning everyone!',
    }
  })

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: employee1.id,
      content: 'Hello boss!',
    }
  })

  console.log('Creating Spin Events and Rewards...')
  const spinEvent = await prisma.spinEvent.create({
    data: {
      name: 'Lunar New Year Spin',
      description: 'For all employees',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      createdById: admin.id,
    }
  })

  const reward1 = await prisma.spinReward.create({
    data: {
      name: '1 Extra Day Off',
      type: 'LEAVE',
      probability: 0.1,
      eventId: spinEvent.id,
      maxQuantity: 5,
      currentQuantity: 0,
    }
  })

  const reward2 = await prisma.spinReward.create({
    data: {
      name: 'Voucher 500k',
      type: 'VOUCHER',
      probability: 0.3,
      eventId: spinEvent.id,
      maxQuantity: 20,
      currentQuantity: 0,
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
