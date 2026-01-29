import envConfig from '@/config'
import { DishStatus, OrderStatus, Role, TableStatus } from '@/constants/type'
import prisma from '@/database'
import { guestRepository } from '@/repositories/guest.repository'
import { GuestCreateOrdersBodyType, GuestLoginBodyType } from '@/schemaValidations/guest.schema'
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

      return createdOrder
    })
    // Keep response backward-compatible: return as an array of orders
    return [result]
  },

  // Get guest orders
  async getOrders(guestId: number) {
    return await guestRepository.findOrdersByGuestId(guestId)
  }
}
