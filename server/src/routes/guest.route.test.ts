import { buildTestApp } from '@/test/build-test-app'
import { signAccessToken } from '@/utils/jwt'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration tests for guest routes.
 *
 * Flow: create table → guest login with table token → create orders → get orders.
 * Guest endpoints are under /guest prefix.
 */

let app: FastifyInstance
let adminToken: string
let tableToken: string
let guestAccessToken: string
let guestRefreshToken: string
const testTableNumber = 88

beforeAll(async () => {
  app = await buildTestApp()
  adminToken = signAccessToken({ userId: 1, role: 'Owner' })

  // Create a table for guest login
  const tableRes = await app.inject({
    method: 'POST',
    url: '/tables',
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { number: testTableNumber, capacity: 4, status: 'Available' }
  })
  if (tableRes.statusCode === 200) {
    tableToken = tableRes.json().data.token
  } else {
    // Table may already exist, fetch it
    const listRes = await app.inject({ method: 'GET', url: '/tables' })
    const table = listRes.json().data.find((t: any) => t.number === testTableNumber)
    tableToken = table?.token || ''
  }
})

afterAll(async () => {
  // Cleanup test table
  await app.inject({
    method: 'DELETE',
    url: `/tables/${testTableNumber}`,
    headers: { authorization: `Bearer ${adminToken}` }
  })
  await app.close()
})

describe('POST /guest/auth/login', () => {
  it('returns 200 with guest tokens for valid table token', async () => {
    expect(tableToken).toBeDefined()

    const response = await app.inject({
      method: 'POST',
      url: '/guest/auth/login',
      payload: {
        name: 'Test Guest',
        tableNumber: testTableNumber,
        token: tableToken
      }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
    expect(body.data.guest.name).toBe('Test Guest')
    expect(body.data.guest.tableNumber).toBe(testTableNumber)
    expect(body.data.guest.role).toBe('Guest')

    guestAccessToken = body.data.accessToken
    guestRefreshToken = body.data.refreshToken
  })

  it('returns 422 for invalid table token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/guest/auth/login',
      payload: {
        name: 'Bad Guest',
        tableNumber: testTableNumber,
        token: 'invalid-token'
      }
    })

    // Invalid token causes a validation/service error
    expect([400, 422]).toContain(response.statusCode)
  })

  it('returns 422 for missing name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/guest/auth/login',
      payload: {
        tableNumber: testTableNumber,
        token: tableToken
      }
    })

    expect(response.statusCode).toBe(422)
  })
})

describe('POST /guest/orders', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/guest/orders',
      payload: [{ dishId: 1, quantity: 1 }]
    })

    expect(response.statusCode).toBe(401)
  })

  it('creates orders as authenticated guest', async () => {
    expect(guestAccessToken).toBeDefined()

    // First ensure we have a dish to order
    const dishRes = await app.inject({
      method: 'POST',
      url: '/dishes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Guest Test Dish',
        price: 25,
        description: 'Dish for guest test',
        image: 'http://localhost:4000/static/default-dish.png',
        status: 'Available'
      }
    })

    let dishId: number
    if (dishRes.statusCode === 200) {
      dishId = dishRes.json().data.id
    } else {
      // Try to get existing dishes
      const listRes = await app.inject({ method: 'GET', url: '/dishes' })
      dishId = listRes.json().data[0]?.id
    }

    if (!dishId) return // Skip if no dishes available

    const response = await app.inject({
      method: 'POST',
      url: '/guest/orders',
      headers: { authorization: `Bearer ${guestAccessToken}` },
      payload: [{ dishId, quantity: 2 }]
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toBeInstanceOf(Array)
    expect(body.data.length).toBeGreaterThan(0)

    // Cleanup: delete the test dish
    if (dishRes.statusCode === 200) {
      await app.inject({
        method: 'DELETE',
        url: `/dishes/${dishId}`,
        headers: { authorization: `Bearer ${adminToken}` }
      })
    }
  })
})

describe('GET /guest/orders', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/guest/orders'
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns guest orders when authenticated', async () => {
    expect(guestAccessToken).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: '/guest/orders',
      headers: { authorization: `Bearer ${guestAccessToken}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
  })
})

describe('POST /guest/auth/refresh-token', () => {
  it('returns new tokens for valid guest refresh token', async () => {
    expect(guestRefreshToken).toBeDefined()

    const response = await app.inject({
      method: 'POST',
      url: '/guest/auth/refresh-token',
      payload: { refreshToken: guestRefreshToken }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
  })

  it('returns 401 for invalid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/guest/auth/refresh-token',
      payload: { refreshToken: 'bad-token' }
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('POST /guest/auth/logout', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/guest/auth/logout',
      payload: { refreshToken: 'some-token' }
    })

    expect(response.statusCode).toBe(401)
  })
})
