import prisma from '@/database'

export const authRepository = {
  // Find account by email
  async findAccountByEmail(email: string) {
    return await prisma.account.findUnique({
      where: { email }
    })
  },

  // RefreshToken operations
  async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUniqueOrThrow({
      where: { token },
      include: {
        account: true
      }
    })
  },

  async createRefreshToken(data: { accountId: number; token: string; expiresAt: Date }) {
    return await prisma.refreshToken.create({
      data
    })
  },

  async deleteRefreshToken(token: string) {
    return await prisma.refreshToken.delete({
      where: { token }
    })
  }
}
