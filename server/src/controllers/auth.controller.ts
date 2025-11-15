import { authService } from '@/services/auth.service'
import { LoginBodyType } from '@/schemaValidations/auth.schema'

export const logoutController = async (refreshToken: string) => {
  return await authService.logout(refreshToken)
}

export const loginController = async (body: LoginBodyType) => {
  return await authService.login(body)
}

export const refreshTokenController = async (refreshToken: string) => {
  return await authService.refreshToken(refreshToken)
}

export const loginGoogleController = async (code: string) => {
  return await authService.loginGoogle(code)
}
