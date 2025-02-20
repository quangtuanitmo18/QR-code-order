import envConfig from '@/config'
import prisma from '@/database'
import { LoginBodyType } from '@/schemaValidations/auth.schema'
import { RoleType, TokenPayload } from '@/types/jwt.types'
import { comparePassword } from '@/utils/crypto'
import { AuthError, EntityError, StatusError } from '@/utils/errors'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import axios from 'axios'

export const logoutController = async (refreshToken: string) => {
  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  })
  return 'Đăng xuất thành công'
}

export const loginController = async (body: LoginBodyType) => {
  const account = await prisma.account.findUnique({
    where: {
      email: body.email
    }
  })
  if (!account) {
    throw new EntityError([{ field: 'email', message: 'Email không tồn tại' }])
  }
  const isPasswordMatch = await comparePassword(body.password, account.password)
  if (!isPasswordMatch) {
    throw new EntityError([{ field: 'password', message: 'Email hoặc mật khẩu không đúng' }])
  }
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

  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt
    }
  })
  return {
    account,
    accessToken,
    refreshToken
  }
}

export const refreshTokenController = async (refreshToken: string) => {
  let decodedRefreshToken: TokenPayload
  try {
    decodedRefreshToken = verifyRefreshToken(refreshToken)
  } catch (error) {
    throw new AuthError('Refresh token không hợp lệ')
  }
  const refreshTokenDoc = await prisma.refreshToken.findUniqueOrThrow({
    where: {
      token: refreshToken
    },
    include: {
      account: true
    }
  })
  const account = refreshTokenDoc.account
  const newAccessToken = signAccessToken({
    userId: account.id,
    role: account.role as RoleType
  })
  const newRefreshToken = signRefreshToken({
    userId: account.id,
    role: account.role as RoleType,
    exp: decodedRefreshToken.exp
  })
  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  })
  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      token: newRefreshToken,
      expiresAt: refreshTokenDoc.expiresAt
    }
  })
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  }
}

/**
 * Hàm này thực hiện gửi yêu cầu lấy Google OAuth token dựa trên authorization code nhận được từ client-side.
 * @param {string} code - Authorization code được gửi từ client-side.
 * @returns {Object} - Đối tượng chứa Google OAuth token.
 */
const getOauthGooleToken = async (code: string) => {
  const body = {
    code,
    client_id: envConfig.GOOGLE_CLIENT_ID,
    client_secret: envConfig.GOOGLE_CLIENT_SECRET,
    redirect_uri: envConfig.GOOGLE_AUTHORIZED_REDIRECT_URI,
    grant_type: 'authorization_code'
  }
  const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return data as {
    access_token: string
    expires_in: number
    refresh_token: string
    scope: string
    token_type: string
    id_token: string
  }
}

/**
 * Hàm này thực hiện gửi yêu cầu lấy thông tin người dùng từ Google dựa trên Google OAuth token.
 * @param {Object} tokens - Đối tượng chứa Google OAuth token.
 * @param {string} tokens.id_token - ID token được lấy từ Google OAuth.
 * @param {string} tokens.access_token - Access token được lấy từ Google OAuth.
 * @returns {Object} - Đối tượng chứa thông tin người dùng từ Google.
 */
const getGoogleUser = async ({ id_token, access_token }: { id_token: string; access_token: string }) => {
  const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
    params: {
      access_token,
      alt: 'json'
    },
    headers: {
      Authorization: `Bearer ${id_token}`
    }
  })
  return data as {
    id: string
    email: string
    verified_email: boolean
    name: string
    given_name: string
    family_name: string
    picture: string
  }
}

export const loginGoogleController = async (code: string) => {
  const data = await getOauthGooleToken(code) // Gửi authorization code để lấy Google OAuth token
  const { id_token, access_token } = data // Lấy ID token và access token từ kết quả trả về
  const googleUser = await getGoogleUser({ id_token, access_token }) // Gửi Google OAuth token để lấy thông tin người dùng từ Google
  // Kiểm tra email đã được xác minh từ Google
  if (!googleUser.verified_email) {
    throw new StatusError({
      status: 403,
      message: 'Email chưa được xác minh từ Google'
    })
  }
  const account = await prisma.account.findUnique({
    where: {
      email: googleUser.email
    }
  })
  if (!account) {
    throw new StatusError({
      status: 403,
      message: 'Tài khoản này không tồn tại trên hệ thống website'
    })
  }
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
  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt
    }
  })
  return {
    accessToken,
    refreshToken,
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role as RoleType
    }
  }
}
