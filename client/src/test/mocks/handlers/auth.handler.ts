import { Role } from '@/constants/type'
import { http, HttpResponse } from 'msw'

const BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:4000'

export const authHandlers = [
  // POST /auth/login (backend, used by sLogin)
  http.post(`${BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        account: {
          id: 1,
          name: 'Admin',
          email: 'admin@order.com',
          role: Role.Owner,
          avatar: null,
        },
      },
      message: 'Login successful',
    })
  }),

  // POST /auth/logout (backend, used by sLogout)
  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logout successful' })
  }),

  // POST /auth/refresh-token (backend)
  http.post(`${BASE_URL}/auth/refresh-token`, () => {
    return HttpResponse.json({
      data: {
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
      },
      message: 'Token refreshed successfully',
    })
  }),

  // GET /accounts/me — get current account info
  http.get(`${BASE_URL}/accounts/me`, () => {
    return HttpResponse.json({
      data: {
        id: 1,
        name: 'Admin',
        email: 'admin@order.com',
        role: Role.Owner,
        avatar: null,
      },
      message: 'Account retrieved successfully',
    })
  }),
]
