import { Role } from '@/constants/type'
import { LoginResType } from '@/schemaValidations/auth.schema'

// Credentials match server .env: INITIAL_EMAIL_OWNER / INITIAL_PASSWORD_OWNER
export const mockAccessToken = 'mock-access-token'
export const mockRefreshToken = 'mock-refresh-token'

export const mockAccount = {
  id: 1,
  name: 'Admin',
  email: 'admin@order.com',
  role: Role.Owner,
  avatar: null,
}

export const mockLoginResponse: LoginResType = {
  data: {
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
    account: mockAccount,
  },
  message: 'Login successful',
}

export const mockEmployeeAccount = {
  id: 2,
  name: 'Employee Test',
  email: 'employee@order.com',
  role: Role.Employee,
  avatar: null,
}
