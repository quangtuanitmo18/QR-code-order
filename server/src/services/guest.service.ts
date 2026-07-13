import envConfig from '@/config'
import { DishStatus, OrderStatus, Role, TableStatus } from '@/constants/type'
import prisma from '@/database'
import { guestRepository } from '@/repositories/guest.repository'
import { GuestCreateOrdersBodyType, GuestLoginBodyType } from '@/schemaValidations/guest.schema'
import { hybridRagService } from '@/services/hybrid-rag.service'
import { TokenPayload } from '@/types/jwt.types'
import { AuthError } from '@/utils/errors'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import ms from 'ms'

export const guestService = {
  // Guest login
  async login(body: GuestLoginBodyType) {
    const table = await guestRepository.findTableByNumberAndToken(body.tableNumber, body.token)
    if (!table) {
      throw new Error('Table does not exist or token is invalid')
    }

    if (table.status === TableStatus.Hidden) {
      throw new Error('Table has been hidden, please choose another table')
    }

    if (table.status === TableStatus.Reserved) {
      throw new Error('Table has been reserved, please contact staff for help')
    }

    let guest = await guestRepository.create({
      name: body.name,
      tableNumber: body.tableNumber
    })

    const refreshToken = signRefreshToken(
      {
        userId: guest.id,
        role: Role.Guest
      },
      {
        expiresIn: ms(envConfig.GUEST_REFRESH_TOKEN_EXPIRES_IN)
      }
    )
    const accessToken = signAccessToken(
      {
        userId: guest.id,
        role: Role.Guest
      },
      {
        expiresIn: ms(envConfig.GUEST_ACCESS_TOKEN_EXPIRES_IN)
      }
    )
    const decodedRefreshToken = verifyRefreshToken(refreshToken)
    const refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000)

    guest = await guestRepository.update(guest.id, {
      refreshToken,
      refreshTokenExpiresAt
    })

    return {
      guest,
      accessToken,
      refreshToken
    }
  },

  // Guest logout
  async logout(id: number) {
    await guestRepository.update(id, {
      refreshToken: null,
      refreshTokenExpiresAt: null
    })
    return 'Logout successfully'
  },

  // Refresh guest token
  async refreshToken(refreshToken: string) {
    let decodedRefreshToken: TokenPayload
    try {
      decodedRefreshToken = verifyRefreshToken(refreshToken)
    } catch (error) {
      throw new AuthError('Refresh token is invalid')
    }

    const newRefreshToken = signRefreshToken({
      userId: decodedRefreshToken.userId,
      role: Role.Guest,
      exp: decodedRefreshToken.exp
    })
    const newAccessToken = signAccessToken(
      {
        userId: decodedRefreshToken.userId,
        role: Role.Guest
      },
      {
        expiresIn: ms(envConfig.GUEST_ACCESS_TOKEN_EXPIRES_IN)
      }
    )

    await guestRepository.update(decodedRefreshToken.userId, {
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000)
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  },

  // Create orders (transaction)
  async createOrders(guestId: number, body: GuestCreateOrdersBodyType) {
    const result = await prisma.$transaction(async (tx) => {
      const guest = await tx.guest.findUniqueOrThrow({
        where: {
          id: guestId
        }
      })
      if (guest.tableNumber === null) {
        throw new Error('Table has been deleted, please logout and choose another table')
      }

      const table = await tx.table.findUniqueOrThrow({
        where: {
          number: guest.tableNumber
        }
      })
      if (table.status === TableStatus.Hidden) {
        throw new Error(`Table ${table.number} has been hidden, please logout and choose another table`)
      }
      if (table.status === TableStatus.Reserved) {
        throw new Error(`Table ${table.number} has been reserved, please logout and choose another table`)
      }

      let totalAmount = 0
      const itemsData: {
        dishSnapshotId: number
        quantity: number
        unitPrice: number
        totalPrice: number
      }[] = []

      for (const order of body) {
        const dish = await tx.dish.findUniqueOrThrow({
          where: {
            id: order.dishId
          }
        })
        if (dish.status === DishStatus.Unavailable) {
          throw new Error(`Dish ${dish.name} is unavailable`)
        }
        if (dish.status === DishStatus.Hidden) {
          throw new Error(`Dish ${dish.name} can not be ordered`)
        }

        const dishSnapshot = await tx.dishSnapshot.create({
          data: {
            description: dish.description,
            image: dish.image,
            name: dish.name,
            price: dish.price,
            dishId: dish.id,
            status: dish.status
          }
        })

        const unitPrice = dishSnapshot.price
        const totalPrice = unitPrice * order.quantity
        totalAmount += totalPrice

        itemsData.push({
          dishSnapshotId: dishSnapshot.id,
          quantity: order.quantity,
          unitPrice,
          totalPrice
        })
      }

      const createdOrder = await tx.order.create({
        data: {
          guestId,
          tableNumber: guest.tableNumber,
          orderHandlerId: null,
          status: OrderStatus.Pending,
          totalAmount,
          items: {
            create: itemsData
          }
        },
        include: {
          items: {
            include: {
              dishSnapshot: true
            }
          },
          guest: true,
          orderHandler: true
        }
      })

      await tx.table.update({
        where: { number: guest.tableNumber },
        data: { status: TableStatus.Reserved }
      })

      return createdOrder
    })
    // Keep response backward-compatible: return as an array of orders
    return [result]
  },

  // Get guest orders
  async getOrders(guestId: number) {
    return await guestRepository.findOrdersByGuestId(guestId)
  },

  /**
   * Cancel a pending order for a guest.
   * Validates ownership and ensures only Pending orders can be cancelled.
   */
  async cancelOrder(orderId: number, guestId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, guestId },
      include: {
        items: { include: { dishSnapshot: true } }
      }
    })

    if (!order) {
      throw new Error(`Order #${orderId} not found or does not belong to you.`)
    }

    if (order.status !== OrderStatus.Pending) {
      throw new Error(
        `Order #${orderId} cannot be cancelled because its status is "${order.status}". Only pending orders can be cancelled.`
      )
    }

    await prisma.order.delete({ where: { id: orderId } })

    return {
      orderId,
      cancelledItems: order.items.map((item) => ({
        name: item.dishSnapshot.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    }
  },

  /**
   * Place an order by dish names (used by AI HITL flow).
   * Handles dish name resolution, fuzzy matching, and delegates to createOrders.
   */
  async placeOrderByName(guestId: number, items: Array<{ dishName: string; quantity: number }>) {
    const orderItems: Array<{ dishId: number; quantity: number }> = []
    const resolvedDishes: Array<{ name: string; price: number; quantity: number }> = []

    for (const item of items) {
      const exactMatches = await prisma.dish.findMany({
        where: { name: { contains: item.dishName.toLowerCase() }, status: 'Available' },
        take: 10
      })

      let dish = exactMatches.find((d) => d.name.toLowerCase() === item.dishName.toLowerCase()) || null

      if (!dish) {
        if (exactMatches.length === 0) {
          throw new Error(`Could not find dish "${item.dishName}". Please check the name.`)
        }
        if (exactMatches.length > 1) {
          throw new Error(
            `Multiple dishes match "${item.dishName}": ${exactMatches.map((d) => `"${d.name}"`).join(', ')}. Please specify.`
          )
        }
        dish = exactMatches[0]
      }

      orderItems.push({ dishId: dish.id, quantity: item.quantity })
      resolvedDishes.push({ name: dish.name, price: dish.price, quantity: item.quantity })
    }

    const orders = await this.createOrders(guestId, orderItems)
    const createdOrder = orders[0]

    return {
      message: 'Order placed successfully! 🎉',
      orderId: createdOrder.id,
      status: createdOrder.status,
      items: resolvedDishes.map((d) => ({
        name: d.name,
        quantity: d.quantity,
        unitPrice: d.price,
        subtotal: d.price * d.quantity
      })),
      totalAmount: createdOrder.totalAmount
    }
  },

  /**
   * Place an order by dish ID (preferred AI HITL flow).
   * Uses dishId for reliable lookup, falls back to name-based search if no ID provided.
   * Fixes the bug where AI uses translated/semantic names that don't match DB names
   * (e.g. "Salad Rau Trộn" from ChromaDB vs "Mixed Green Salad" in the DB).
   */
  async placeOrderById(guestId: number, items: Array<{ dishId?: number; dishName: string; quantity: number }>) {
    const orderItems: Array<{ dishId: number; quantity: number }> = []
    const resolvedDishes: Array<{ name: string; price: number; quantity: number }> = []

    for (const item of items) {
      let dish = null

      // ID-first: reliable even when AI uses translated/semantic names
      if (item.dishId) {
        dish = await prisma.dish.findFirst({
          where: { id: item.dishId, status: 'Available' }
        })
      }

      // Fallback 2: name-based SQL lookup (works for exact English names)
      if (!dish) {
        const matches = await prisma.dish.findMany({
          where: { name: { contains: item.dishName, mode: 'insensitive' }, status: 'Available' },
          take: 10
        })

        dish = matches.find((d) => d.name.toLowerCase() === item.dishName.toLowerCase()) || null

        if (!dish && matches.length === 1) {
          dish = matches[0] // Accept single partial match
        }

        // Fallback 3: semantic search (handles translated/multilingual names like "Salad Trộn" → "Mixed Green Salad")
        if (!dish) {
          const semanticResults = await hybridRagService.searchMenu(item.dishName).catch(() => [])
          const topMatch = semanticResults[0]

          if (topMatch && topMatch.id) {
            // Validate semantic match: check the matched dish name shares at least one significant word
            const requestedWords = new Set(item.dishName.toLowerCase().split(/\s+/).filter(w => w.length > 2))
            const matchedWords = (topMatch.name || '').toLowerCase().split(/\s+/)
            const hasOverlap = matchedWords.some(w => requestedWords.has(w))

            if (hasOverlap) {
              dish = await prisma.dish.findFirst({
                where: { id: topMatch.id, status: 'Available' }
              })
            }
          }

          if (!dish) {
            throw new Error(
              `Could not find dish "${item.dishName}". Please search the menu first and use the exact dish name or ID.`
            )
          }
        }
      }

      orderItems.push({ dishId: dish.id, quantity: item.quantity })
      resolvedDishes.push({ name: dish.name, price: dish.price, quantity: item.quantity })
    }

    const orders = await this.createOrders(guestId, orderItems)
    const createdOrder = orders[0]

    return {
      message: 'Order placed successfully! 🎉',
      orderId: createdOrder.id,
      status: createdOrder.status,
      items: resolvedDishes.map((d) => ({
        name: d.name,
        quantity: d.quantity,
        unitPrice: d.price,
        subtotal: d.price * d.quantity
      })),
      totalAmount: createdOrder.totalAmount
    }
  }
}
