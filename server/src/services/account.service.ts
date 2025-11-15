import envConfig from '@/config'
import { PrismaErrorCode } from '@/constants/error-reference'
import { Role, TableStatus } from '@/constants/type'
import prisma from '@/database'
import { accountRepository } from '@/repositories/account.repository'
import {
  ChangePasswordBodyType,
  CreateEmployeeAccountBodyType,
  CreateGuestBodyType,
  UpdateEmployeeAccountBodyType,
  UpdateMeBodyType
} from '@/schemaValidations/account.schema'
import { RoleType } from '@/types/jwt.types'
import { comparePassword, hashPassword } from '@/utils/crypto'
import { EntityError, isPrismaClientKnownRequestError } from '@/utils/errors'
import { getChalk } from '@/utils/helpers'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt'

export const accountService = {
  // Initialize owner account on first run
  async initOwnerAccount() {
    const accountCount = await accountRepository.count()
    if (accountCount === 0) {
      const hashedPassword = await hashPassword(envConfig.INITIAL_PASSWORD_OWNER)
      await accountRepository.createOwner({
        name: 'Owner',
        email: envConfig.INITIAL_EMAIL_OWNER,
        password: hashedPassword,
        role: Role.Owner
      })
      const chalk = await getChalk()
      console.log(
        chalk.bgCyan(`Create owner account: ${envConfig.INITIAL_EMAIL_OWNER}|${envConfig.INITIAL_PASSWORD_OWNER}`)
      )
    }
  },

  // Create employee account
  async createEmployee(body: CreateEmployeeAccountBodyType) {
    try {
      const hashedPassword = await hashPassword(body.password)
      return await accountRepository.createEmployee({
        name: body.name,
        email: body.email,
        password: hashedPassword,
        avatar: body.avatar
      })
    } catch (error: any) {
      if (isPrismaClientKnownRequestError(error)) {
        if (error.code === PrismaErrorCode.UniqueConstraintViolation) {
          throw new EntityError([{ field: 'email', message: 'Email already exists' }])
        }
      }
      throw error
    }
  },

  // Get employee accounts only
  async getEmployees() {
    return await accountRepository.findEmployees()
  },

  // Get all accounts
  async getAllAccounts() {
    return await accountRepository.findAll()
  },

  // Get account by ID
  async getAccountById(id: number) {
    return await accountRepository.findById(id)
  },

  // Update employee account
  async updateEmployee(accountId: number, body: UpdateEmployeeAccountBodyType) {
    try {
      const [socketRecord, oldAccount] = await Promise.all([
        accountRepository.findSocketByAccountId(accountId),
        accountRepository.findById(accountId)
      ])

      const isChangeRole = oldAccount.role !== body.role

      const updateData: any = {
        name: body.name,
        email: body.email,
        avatar: body.avatar,
        role: body.role
      }

      if (body.changePassword && body.password) {
        const hashedPassword = await hashPassword(body.password)
        updateData.password = hashedPassword
      }

      const account = await accountRepository.update(accountId, updateData)

      return {
        account,
        socketId: socketRecord?.socketId,
        isChangeRole
      }
    } catch (error: any) {
      if (isPrismaClientKnownRequestError(error)) {
        if (error.code === PrismaErrorCode.UniqueConstraintViolation) {
          throw new EntityError([{ field: 'email', message: 'Email already exists' }])
        }
      }
      throw error
    }
  },

  // Delete employee account
  async deleteEmployee(accountId: number) {
    const socketRecord = await accountRepository.findSocketByAccountId(accountId)
    const account = await accountRepository.delete(accountId)
    return {
      account,
      socketId: socketRecord?.socketId
    }
  },

  // Get current user info
  async getMe(accountId: number) {
    return await accountRepository.findById(accountId)
  },

  // Update current user profile
  async updateMe(accountId: number, body: UpdateMeBodyType) {
    return await accountRepository.updateProfile(accountId, body)
  },

  // Change password
  async changePassword(accountId: number, body: ChangePasswordBodyType) {
    const account = await accountRepository.findById(accountId)
    const isSame = await comparePassword(body.oldPassword, account.password)
    if (!isSame) {
      throw new EntityError([{ field: 'oldPassword', message: 'Old password is incorrect' }])
    }
    const hashedPassword = await hashPassword(body.password)
    return await accountRepository.updatePassword(accountId, hashedPassword)
  },

  // Change password v2 (with token refresh)
  async changePasswordV2(accountId: number, body: ChangePasswordBodyType) {
    const account = await this.changePassword(accountId, body)

    // Delete all refresh tokens
    await accountRepository.deleteRefreshTokens(accountId)

    // Generate new tokens
    const accessToken = signAccessToken({
      userId: account.id,
      role: account.role as RoleType
    })
    const refreshToken = signRefreshToken({
      userId: account.id,
      role: account.role as RoleType
    })
    const decodedRefreshToken = verifyRefreshToken(refreshToken)
    const refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000)

    await accountRepository.createRefreshToken({
      accountId: account.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt
    })

    return {
      account,
      accessToken,
      refreshToken
    }
  },

  // Get guest list with filters
  async getGuests(filters: { fromDate?: Date; toDate?: Date }) {
    return await accountRepository.findGuests(filters)
  },

  // Create guest
  async createGuest(body: CreateGuestBodyType) {
    const table = await prisma.table.findUnique({
      where: {
        number: body.tableNumber
      }
    })
    if (!table) {
      throw new Error('Table does not exist')
    }
    if (table.status === TableStatus.Hidden) {
      throw new Error(`Table ${table.number} is hidden, please choose another table`)
    }
    return await accountRepository.createGuest(body)
  }
}
