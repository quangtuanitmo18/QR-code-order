import prisma from '@/database'
import { CreateTableBodyType, UpdateTableBodyType } from '@/schemaValidations/table.schema'
import { EntityError, isPrismaClientKnownRequestError } from '@/utils/errors'
import { randomId } from '@/utils/helpers'

export const getTableList = () => {
  return prisma.table.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getTableDetail = (number: number) => {
  return prisma.table.findUniqueOrThrow({
    where: {
      number
    }
  })
}

export const createTable = async (data: CreateTableBodyType) => {
  const token = randomId()
  try {
    const result = await prisma.table.create({
      data: {
        ...data,
        token
      }
    })
    return result
  } catch (error) {
    if (isPrismaClientKnownRequestError(error) && error.code === 'P2002') {
      throw new EntityError([
        {
          message: 'Số bàn này đã tồn tại',
          field: 'number'
        }
      ])
    }
    throw error
  }
}

export const updateTable = (number: number, data: UpdateTableBodyType) => {
  if (data.changeToken) {
    const token = randomId()
    // Xóa hết các refresh token của guest theo table
    return prisma.$transaction(async (tx) => {
      const [table] = await Promise.all([
        tx.table.update({
          where: {
            number
          },
          data: {
            status: data.status,
            capacity: data.capacity,
            token
          }
        }),
        tx.guest.updateMany({
          where: {
            tableNumber: number
          },
          data: {
            refreshToken: null,
            refreshTokenExpiresAt: null
          }
        })
      ])
      return table
    })
  }
  return prisma.table.update({
    where: {
      number
    },
    data: {
      status: data.status,
      capacity: data.capacity
    }
  })
}

export const deleteTable = (number: number) => {
  return prisma.table.delete({
    where: {
      number
    }
  })
}
