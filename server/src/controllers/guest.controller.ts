import envConfig from '@/config'
import { DishStatus, OrderStatus, Role, TableStatus } from '@/constants/type'
import prisma from '@/database'
import { GuestCreateOrdersBodyType, GuestLoginBodyType } from '@/schemaValidations/guest.schema'
import { TokenPayload } from '@/types/jwt.types'
import { AuthError } from '@/utils/errors'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import ms from 'ms'

export const guestLoginController = async (body: GuestLoginBodyType) => {
  const table = await prisma.table.findUnique({
    where: {
      number: body.tableNumber,
      token: body.token
    }
  })
  if (!table) {
    throw new Error('Table does not exist or token is invalid')
  }

  if (table.status === TableStatus.Hidden) {
    throw new Error('Table has been hidden, please choose another table')
  }

  if (table.status === TableStatus.Reserved) {
    throw new Error('Table has been reserved, please contact staff for help')
  }

  let guest = await prisma.guest.create({
    data: {
      name: body.name,
      tableNumber: body.tableNumber
    }
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

  guest = await prisma.guest.update({
    where: {
      id: guest.id
    },
    data: {
      refreshToken,
      refreshTokenExpiresAt
    }
  })

  return {
    guest,
    accessToken,
    refreshToken
  }
}

export const guestLogoutController = async (id: number) => {
  await prisma.guest.update({
    where: {
      id
    },
    data: {
      refreshToken: null,
      refreshTokenExpiresAt: null
    }
  })
  return 'Logout successfully'
}

export const guestRefreshTokenController = async (refreshToken: string) => {
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
  await prisma.guest.update({
    where: {
      id: decodedRefreshToken.userId
    },
    data: {
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000)
    }
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  }
}

export const guestCreateOrdersController = async (guestId: number, body: GuestCreateOrdersBodyType) => {
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
    const orders = await Promise.all(
      body.map(async (order) => {
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
        const orderRecord = await tx.order.create({
          data: {
            dishSnapshotId: dishSnapshot.id,
            guestId,
            quantity: order.quantity,
            tableNumber: guest.tableNumber,
            orderHandlerId: null,
            status: OrderStatus.Pending
          },
          include: {
            dishSnapshot: true,
            guest: true,
            orderHandler: true
          }
        })
        type OrderRecord = typeof orderRecord
        return orderRecord as OrderRecord & {
          status: (typeof OrderStatus)[keyof typeof OrderStatus]
          dishSnapshot: OrderRecord['dishSnapshot'] & {
            status: (typeof DishStatus)[keyof typeof DishStatus]
          }
        }
      })
    )
    return orders
  })
  return result
}

export const guestGetOrdersController = async (guestId: number) => {
  const orders = await prisma.order.findMany({
    where: {
      guestId
    },
    include: {
      dishSnapshot: true,
      orderHandler: true,
      guest: true
    }
  })
  return orders
}
