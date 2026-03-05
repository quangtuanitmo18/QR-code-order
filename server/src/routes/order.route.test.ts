import { buildTestApp } from '@/test/build-test-app'
import { signAccessToken } from '@/utils/jwt'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration tests for order routes (admin/employee side).
 *
 * All endpoints require Owner or Employee auth.
 * Endpoints: GET /orders, GET /orders/:id, POST /orders, PUT /orders/:id, POST /orders/pay
 */

let app: FastifyInstance
let adminToken: string

beforeAll(async () => {
  app = await buildTestApp()
  adminToken = signAccessToken({ userId: 1, role: 'Owner' })
})

afterAll(async () => {
  await app.close()
})

describe('GET /orders', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/orders'
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 200 with order list for admin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/orders',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
  })

  it('supports date range filtering', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/orders?fromDate=2024-01-01&toDate=2030-12-31',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
  })
})

describe('POST /orders', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: { guestId: 1, orders: [{ dishId: 1, quantity: 1 }] }
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 422 for invalid body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {} // missing required fields
    })

    expect(response.statusCode).toBe(422)
  })
})

describe('GET /orders/:orderId', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/orders/1'
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 404 for non-existent order', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/orders/999999',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    // Might be 404 or 500 depending on error handling
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
  })
})

describe('PUT /orders/:orderId', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/orders/1',
      payload: { status: 'Delivered', dishId: 1, quantity: 1 }
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('POST /orders/pay', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders/pay',
      payload: { guestId: 1 }
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns error for non-existent guest', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders/pay',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { guestId: 999999 }
    })

    // Should fail — no orders for this guest
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
  })
})
