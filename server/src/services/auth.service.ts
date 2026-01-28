import envConfig from '@/config'
import { authRepository } from '@/repositories/auth.repository'
import { LoginBodyType } from '@/schemaValidations/auth.schema'
import { RoleType, TokenPayload } from '@/types/jwt.types'
import { comparePassword } from '@/utils/crypto'
import { AuthError, EntityError, StatusError } from '@/utils/errors'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import axios from 'axios'
import qs from 'querystring'

export const authService = {
  // Logout user
  async logout(refreshToken: string) {
    await authRepository.deleteRefreshToken(refreshToken)
    return 'Logout successfully'
  },

  // Login with email/password
  async login(body: LoginBodyType) {
    const account = await authRepository.findAccountByEmail(body.email)
    if (!account) {
      throw new EntityError([{ field: 'email', message: 'Email does not exist' }])
    }
    const isPasswordMatch = await comparePassword(body.password, account.password)
    if (!isPasswordMatch) {
      throw new EntityError([{ field: 'password', message: 'Email or password is incorrect' }])
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

    await authRepository.createRefreshToken({
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

  // Refresh access token
  async refreshToken(refreshToken: string) {
    let decodedRefreshToken: TokenPayload
    try {
      decodedRefreshToken = verifyRefreshToken(refreshToken)
    } catch (error) {
      throw new AuthError('Refresh token is invalid')
    }

    const refreshTokenDoc = await authRepository.findRefreshToken(refreshToken)
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

    await authRepository.deleteRefreshToken(refreshToken)
    await authRepository.createRefreshToken({
      accountId: account.id,
      token: newRefreshToken,
      expiresAt: refreshTokenDoc.expiresAt
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  },

  // Google OAuth: Get token from authorization code
  async getOauthGoogleToken(code: string) {
    const bodyData = {
      code,
      client_id: envConfig.GOOGLE_CLIENT_ID,
      client_secret: envConfig.GOOGLE_CLIENT_SECRET,
      redirect_uri: envConfig.GOOGLE_AUTHORIZED_REDIRECT_URI,
      grant_type: 'authorization_code'
    }

    try {
      const encodedBody = qs.stringify(bodyData)
      const response = await axios.post('https://oauth2.googleapis.com/token', encodedBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return response.data
    } catch (error) {
      console.error('Google OAuth error:', (error as any)?.response.status, (error as any)?.response.data)
      throw new StatusError({
        status: 500,
        message: 'Can not connect to Google OAuth'
      })
    }
  },

  // Google OAuth: Get user info from token
  async getGoogleUser({ id_token, access_token }: { id_token: string; access_token: string }) {
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
  },

  // Login with Google
  async loginGoogle(code: string) {
    const data = await this.getOauthGoogleToken(code)
    const { id_token, access_token } = data
    const googleUser = await this.getGoogleUser({ id_token, access_token })

    if (!googleUser.verified_email) {
      throw new StatusError({
        status: 403,
        message: 'Unverified email from Google'
      })
    }

    const account = await authRepository.findAccountByEmail(googleUser.email)
    if (!account) {
      throw new StatusError({
        status: 403,
        message: 'This account does not exist on the website'
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

    await authRepository.createRefreshToken({
      accountId: account.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt
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
}
