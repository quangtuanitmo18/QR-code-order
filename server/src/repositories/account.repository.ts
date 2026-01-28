import { Role } from '@/constants/type'
import prisma from '@/database'

export interface AccountFilters {
  role?: string
  fromDate?: Date
  toDate?: Date
}

export const accountRepository = {
  // Count all accounts
  async count() {
    return await prisma.account.count()
  },

  // Create account (for initialization)
  async createOwner(data: { name: string; email: string; password: string; role: string }) {
    return await prisma.account.create({
      data
    })
  },

  // Create employee account
  async createEmployee(data: { name: string; email: string; password: string; avatar?: string }) {
    return await prisma.account.create({
      data: {
        ...data,
        role: Role.Employee
      }
    })
  },

  // Get all employee accounts
  async findEmployees() {
    return await prisma.account.findMany({
      where: {
        role: Role.Employee
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  // Get all accounts
  async findAll() {
    return await prisma.account.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  // Find account by ID
  async findById(id: number) {
    return await prisma.account.findUniqueOrThrow({
      where: { id }
    })
  },

  // Find account by email
  async findByEmail(email: string) {
    return await prisma.account.findUnique({
      where: { email }
    })
  },

  // Update account (full update)
  async update(id: number, data: { name: string; email: string; avatar?: string; password?: string; role?: string }) {
    return await prisma.account.update({
      where: { id },
      data
    })
  },

  // Update account profile (no password/role)
  async updateProfile(id: number, data: { name: string; avatar?: string }) {
    return await prisma.account.update({
      where: { id },
      data
    })
  },

  // Update password
  async updatePassword(id: number, password: string) {
    return await prisma.account.update({
      where: { id },
      data: { password }
    })
  },

  // Delete account
  async delete(id: number) {
    return await prisma.account.delete({
      where: { id }
    })
  },

  // Get socket by account ID
  async findSocketByAccountId(accountId: number) {
    return await prisma.socket.findUnique({
      where: { accountId }
    })
  },

  // Guest operations
  async findGuests(filters: { fromDate?: Date; toDate?: Date }) {
    return await prisma.guest.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        createdAt: {
          gte: filters.fromDate,
          lte: filters.toDate
        }
      }
    })
  },

  async createGuest(data: { name: string; tableNumber: number }) {
    return await prisma.guest.create({
      data
    })
  },

  // RefreshToken operations
  async deleteRefreshTokens(accountId: number) {
    return await prisma.refreshToken.deleteMany({
      where: { accountId }
    })
  },

  async createRefreshToken(data: { accountId: number; token: string; expiresAt: Date }) {
    return await prisma.refreshToken.create({
      data
    })
  }
}
