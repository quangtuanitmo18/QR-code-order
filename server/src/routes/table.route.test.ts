import { buildTestApp } from '@/test/build-test-app'
import { signAccessToken } from '@/utils/jwt'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration tests for table routes using app.inject().
 *
 * Tests CRUD operations for tables:
 * - GET /tables (list all)
 * - POST /tables (create)
 * - PUT /tables/:number (update)
 * - DELETE /tables/:number (delete)
 *
 * GET /tables is public. POST/PUT/DELETE require Owner/Employee auth.
 */

let app: FastifyInstance
let adminToken: string
const testTableNumber = 77

beforeAll(async () => {
  app = await buildTestApp()
  // Sign a token directly to avoid login response serialization issues
  adminToken = signAccessToken({ userId: 1, role: 'Owner' })
})

afterAll(async () => {
  // Cleanup: try to delete the test table
  await app.inject({
    method: 'DELETE',
    url: `/tables/${testTableNumber}`,
    headers: { authorization: `Bearer ${adminToken}` }
  })
  await app.close()
})

describe('GET /tables', () => {
  it('returns 200 with table list (public endpoint)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tables'
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
  })
})

describe('POST /tables', () => {
  it('creates a new table', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tables',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        number: testTableNumber,
        capacity: 8,
        status: 'Available'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.number).toBe(testTableNumber)
    expect(body.data.capacity).toBe(8)
    expect(body.data.token).toBeDefined()
  })

  it('returns 422 for duplicate table number', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tables',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        number: testTableNumber,
        capacity: 4,
        status: 'Available'
      }
    })

    expect(response.statusCode).toBe(422)
  })

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tables',
      payload: { number: 100, capacity: 4, status: 'Available' }
    })
    expect(response.statusCode).toBe(401)
  })
})

describe('PUT /tables/:number', () => {
  it('updates table capacity', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/tables/${testTableNumber}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        capacity: 12,
        status: 'Available',
        changeToken: false
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.capacity).toBe(12)
  })

  it('changes token when changeToken is true', async () => {
    // Get current token
    const listRes = await app.inject({
      method: 'GET',
      url: '/tables',
      headers: { authorization: `Bearer ${adminToken}` }
    })
    const oldTable = listRes.json().data.find((t: any) => t.number === testTableNumber)

    const response = await app.inject({
      method: 'PUT',
      url: `/tables/${testTableNumber}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        capacity: 12,
        status: 'Available',
        changeToken: true
      }
    })

    expect(response.statusCode).toBe(200)
    if (oldTable) {
      expect(response.json().data.token).not.toBe(oldTable.token)
    }
  })
})

describe('DELETE /tables/:number', () => {
  it('deletes the test table', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/tables/${testTableNumber}`,
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
  })

  it('returns 404 for non-existent table', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/tables/9999',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(404)
  })
})
