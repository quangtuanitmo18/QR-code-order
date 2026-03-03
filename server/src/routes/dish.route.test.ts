import { buildTestApp } from '@/test/build-test-app'
import { signAccessToken } from '@/utils/jwt'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration tests for dish routes using app.inject().
 *
 * Endpoints:
 * - GET /dishes (public)
 * - GET /dishes/:id
 * - POST /dishes (Owner/Employee)
 * - PUT /dishes/:id (Owner/Employee)
 * - DELETE /dishes/:id (Owner/Employee)
 */

let app: FastifyInstance
let adminToken: string
let createdDishId: number

beforeAll(async () => {
  app = await buildTestApp()
  // Sign a token directly to avoid login response serialization issues
  adminToken = signAccessToken({ userId: 1, role: 'Owner' })
})

afterAll(async () => {
  // Cleanup: delete test dish if it exists
  if (createdDishId) {
    await app.inject({
      method: 'DELETE',
      url: `/dishes/${createdDishId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    })
  }
  await app.close()
})

describe('GET /dishes', () => {
  it('returns 200 with dish list (public)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/dishes'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
    expect(response.json().message).toBeDefined()
  })
})

describe('POST /dishes', () => {
  it('creates a new dish as admin', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/dishes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'E2E Test Pasta',
        price: 16,
        description: 'Test dish for integration tests',
        image: 'http://localhost:4000/static/default-dish.png',
        status: 'Available'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.name).toBe('E2E Test Pasta')
    expect(body.data.price).toBe(16)
    expect(body.data.id).toBeDefined()
    createdDishId = body.data.id
  })

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/dishes',
      payload: {
        name: 'No Auth Dish',
        price: 10,
        description: 'Should fail',
        image: 'http://example.com/img.png'
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 422 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/dishes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Incomplete Dish'
        // missing price, description, image
      }
    })

    expect(response.statusCode).toBe(422)
  })
})

describe('GET /dishes/:id', () => {
  it('returns dish by ID', async () => {
    expect(createdDishId).toBeGreaterThan(0)

    const response = await app.inject({
      method: 'GET',
      url: `/dishes/${createdDishId}`
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.id).toBe(createdDishId)
  })

  it('returns 404 for non-existent dish', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/dishes/999999'
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('PUT /dishes/:id', () => {
  it('updates dish name', async () => {
    expect(createdDishId).toBeGreaterThan(0)

    const response = await app.inject({
      method: 'PUT',
      url: `/dishes/${createdDishId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Updated Test Pasta',
        price: 19,
        description: 'Updated description',
        image: 'http://localhost:4000/static/default-dish.png',
        status: 'Available'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.name).toBe('Updated Test Pasta')
    expect(response.json().data.price).toBe(19)
  })
})

describe('DELETE /dishes/:id', () => {
  it('deletes dish as admin', async () => {
    expect(createdDishId).toBeGreaterThan(0)

    const response = await app.inject({
      method: 'DELETE',
      url: `/dishes/${createdDishId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    createdDishId = 0 // Mark as deleted so afterAll doesn't try again
  })

  it('returns 404 for non-existent dish', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/dishes/999999',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(404)
  })
})
