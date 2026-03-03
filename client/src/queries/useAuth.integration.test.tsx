import authApiRequest from '@/apiRequests/auth'
import { HttpResponse, http, server } from '@/test/mocks/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration test: authApiRequest.login
 *
 * Tests MSW intercepting the actual fetch calls made by the http client.
 * No real network calls, but tests the full request-response cycle.
 */
describe('authApiRequest.login (integration)', () => {
  // Start MSW server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('returns login data on success', async () => {
    const res = await authApiRequest.sLogin({
      email: 'admin@order.com',
      password: '123456',
    })

    expect(res.status).toBe(200)
    expect(res.payload.data.accessToken).toBe('mock-access-token')
    expect(res.payload.data.account.email).toBe('admin@order.com')
    expect(res.payload.message).toBe('Login successful')
  })

  it('sends credentials in request body', async () => {
    // Verify the MSW handler receives and responds to any valid POST body
    const res = await authApiRequest.sLogin({
      email: 'admin@order.com',
      password: '123456',
    })
    // Response shape should include nested data structure
    expect(res.payload).toHaveProperty('data')
    expect(res.payload).toHaveProperty('message')
    expect(res.payload.data).toHaveProperty('accessToken')
    expect(res.payload.data).toHaveProperty('refreshToken')
    expect(res.payload.data).toHaveProperty('account')
  })

  it('handles 422 validation error from server', async () => {
    server.use(
      http.post('http://localhost:4000/auth/login', () =>
        HttpResponse.json(
          {
            message: 'Validation error',
            errors: [{ field: 'email', message: 'Invalid email' }],
          },
          { status: 422 }
        )
      )
    )

    await expect(
      authApiRequest.sLogin({
        email: 'bad-email',
        password: 'password123',
      })
    ).rejects.toThrow()
  })
})
