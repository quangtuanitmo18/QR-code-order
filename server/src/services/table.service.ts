import prisma from '@/database'
import { tableRepository } from '@/repositories/table.repository'
import { CreateTableBodyType, UpdateTableBodyType } from '@/schemaValidations/table.schema'
import { EntityError, isPrismaClientKnownRequestError } from '@/utils/errors'
import { randomId } from '@/utils/helpers'

export const tableService = {
  // Get all tables
  async getTableList() {
    return await tableRepository.findAll()
  },

  // Get table detail
  async getTableDetail(number: number) {
    return await tableRepository.findByNumber(number)
  },

  // Create table
  async createTable(data: CreateTableBodyType) {
    const token = randomId()
    try {
      const result = await tableRepository.create({
        number: data.number,
        capacity: data.capacity,
        status: data.status!,
        token
      })
      return result
    } catch (error) {
      if (isPrismaClientKnownRequestError(error) && error.code === 'P2002') {
        throw new EntityError([
          {
            message: 'Table number already exists',
            field: 'number'
          }
        ])
      }
      throw error
    }
  },

  // Update table
  async updateTable(number: number, data: UpdateTableBodyType) {
    if (data.changeToken) {
      const token = randomId()
      // Clear all guest refresh tokens for this table
      return await prisma.$transaction(async (tx) => {
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
    return await tableRepository.update(number, {
      status: data.status,
      capacity: data.capacity
    })
  },

  // Delete table
  async deleteTable(number: number) {
    return await tableRepository.delete(number)
  }
}
