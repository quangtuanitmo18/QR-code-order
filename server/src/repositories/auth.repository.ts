import prisma from '@/database'
import { getContextLogger } from '@/utils/logger'

export const authRepository = {
  // Find account by email
  async findAccountByEmail(email: string) {
    try {
      return await prisma.account.findUnique({
        where: { email }
      })
    } catch (error) {
      const logger = getContextLogger()
      if (logger) logger.error({ err: error, email }, 'Error finding account by email')
      throw error
    }
  },

  // RefreshToken operations
  async findRefreshToken(token: string) {
    try {
      return await prisma.refreshToken.findUniqueOrThrow({
        where: { token },
        include: {
          account: true
        }
      })
    } catch (error) {
      const logger = getContextLogger()
      if (logger) logger.error({ err: error }, 'Error finding/validating refresh token')
      throw error
    }
  },

  async createRefreshToken(data: { accountId: number; token: string; expiresAt: Date }) {
    try {
      return await prisma.refreshToken.create({
        data
      })
    } catch (error) {
      const logger = getContextLogger()
      if (logger) logger.error({ err: error, accountId: data.accountId }, 'Error creating refresh token')
      throw error
    }
  },

  async deleteRefreshToken(token: string) {
    try {
      return await prisma.refreshToken.delete({
        where: { token }
      })
    } catch (error) {
      const logger = getContextLogger()
      if (logger) logger.error({ err: error }, 'Error deleting refresh token')
      throw error
    }
  }
}
