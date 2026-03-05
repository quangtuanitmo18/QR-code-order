import { buildTestApp } from '@/test/build-test-app'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration tests for auth routes using app.inject().
 *
 * Tests hit the real test database (test.db).
 * Requires: admin@order.com / 123456 (seeded by global-setup).
 */

let app: FastifyInstance
// Tokens obtained from the login test and reused across all auth tests
let savedAccessToken: string
let savedRefreshToken: string

beforeAll(async () => {
  app = await buildTestApp()
})

afterAll(async () => {
  await app.close()
})

describe('POST /auth/login', () => {
  it('returns 200 with tokens for valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@order.com',
        password: '123456'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
    expect(body.data.account.email).toBe('admin@order.com')
    expect(body.data.account.role).toBe('Owner')
    expect(body.data.account.id).toBeDefined()
    // Ensure password is NOT leaked in response
    expect(body.data.account.password).toBeUndefined()

    // Save tokens for subsequent tests
    savedAccessToken = body.data.accessToken
    savedRefreshToken = body.data.refreshToken
  })

  it('returns 422 for wrong email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'nonexistent@order.com',
        password: '123456'
      }
    })

    expect(response.statusCode).toBe(422)
  })

  it('returns 422 for wrong password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@order.com',
        password: 'wrongpassword'
      }
    })

    expect(response.statusCode).toBe(422)
  })

  it('returns 422 for missing email field', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        password: '123456'
      }
    })

    expect(response.statusCode).toBe(422)
  })

  it('returns 422 for invalid email format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'not-an-email',
        password: '123456'
      }
    })

    expect(response.statusCode).toBe(422)
  })

  it('returns 422 for password too short', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@order.com',
        password: '12345' // min 6
      }
    })

    expect(response.statusCode).toBe(422)
  })
})

describe('POST /auth/refresh-token', () => {
  it('returns new tokens for valid refresh token', async () => {
    expect(savedRefreshToken).toBeDefined()

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh-token',
      payload: { refreshToken: savedRefreshToken }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
    expect(body.data.refreshToken).not.toBe(savedRefreshToken)

    // Update tokens for use by logout test
    savedAccessToken = body.data.accessToken
    savedRefreshToken = body.data.refreshToken
  })

  it('returns 401 for invalid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh-token',
      payload: { refreshToken: 'invalid-token' }
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('POST /auth/logout', () => {
  it('returns 200 when authenticated with valid tokens', async () => {
    expect(savedAccessToken).toBeDefined()
    expect(savedRefreshToken).toBeDefined()

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${savedAccessToken}` },
      payload: { refreshToken: savedRefreshToken }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toBeDefined()
  })

  it('returns 401 when not authenticated', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: { refreshToken: 'some-token' }
    })

    expect(response.statusCode).toBe(401)
  })
})
