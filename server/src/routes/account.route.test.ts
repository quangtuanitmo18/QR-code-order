import { buildTestApp } from '@/test/build-test-app'
import { signAccessToken } from '@/utils/jwt'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration tests for account routes.
 *
 * All endpoints require login. CRUD for employee accounts requires Owner role.
 * Endpoints: GET /accounts, GET /accounts/me, POST /accounts,
 *            GET/PUT/DELETE /accounts/detail/:id, PUT /accounts/me,
 *            PUT /accounts/change-password
 */

let app: FastifyInstance
let adminToken: string
let employeeToken: string
let createdEmployeeId: number

beforeAll(async () => {
  app = await buildTestApp()
  adminToken = signAccessToken({ userId: 1, role: 'Owner' })
  employeeToken = signAccessToken({ userId: 999, role: 'Employee' })
})

afterAll(async () => {
  // Cleanup: delete test employee if exists
  if (createdEmployeeId) {
    await app.inject({
      method: 'DELETE',
      url: `/accounts/detail/${createdEmployeeId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    })
  }
  await app.close()
})

describe('GET /accounts', () => {
  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts'
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 200 with account list for owner', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
  })

  it('returns 200 for employee (or relation allows)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts',
      headers: { authorization: `Bearer ${employeeToken}` }
    })

    // Employee or Owner can access (relation: 'or')
    expect(response.statusCode).toBe(200)
  })
})

describe('GET /accounts/employees', () => {
  it('returns 200 with employee list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts/employees',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
  })
})

describe('POST /accounts', () => {
  it('creates employee account as owner', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Test Employee',
        email: `test-emp-${Date.now()}@order.com`,
        password: '123456',
        confirmPassword: '123456'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data.name).toBe('Test Employee')
    expect(body.data.role).toBe('Employee')
    expect(body.data.id).toBeDefined()
    createdEmployeeId = body.data.id
  })

  it('returns 422 for mismatched passwords', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Bad Employee',
        email: 'bad@order.com',
        password: '123456',
        confirmPassword: '654321'
      }
    })

    expect(response.statusCode).toBe(422)
  })

  it('returns 422 for duplicate email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Duplicate',
        email: 'admin@order.com',
        password: '123456',
        confirmPassword: '123456'
      }
    })

    expect(response.statusCode).toBe(422)
  })

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/accounts',
      payload: {
        name: 'No Auth',
        email: 'noauth@order.com',
        password: '123456',
        confirmPassword: '123456'
      }
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('GET /accounts/detail/:id', () => {
  it('returns employee details for owner', async () => {
    expect(createdEmployeeId).toBeGreaterThan(0)

    const response = await app.inject({
      method: 'GET',
      url: `/accounts/detail/${createdEmployeeId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.id).toBe(createdEmployeeId)
  })

  it('returns 404 for non-existent account', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts/detail/999999',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBeGreaterThanOrEqual(400)
  })
})

describe('PUT /accounts/detail/:id', () => {
  it('updates employee name', async () => {
    expect(createdEmployeeId).toBeGreaterThan(0)

    const response = await app.inject({
      method: 'PUT',
      url: `/accounts/detail/${createdEmployeeId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Updated Employee',
        email: `test-emp-updated-${Date.now()}@order.com`,
        role: 'Employee'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.name).toBe('Updated Employee')
  })
})

describe('DELETE /accounts/detail/:id', () => {
  it('deletes employee account', async () => {
    expect(createdEmployeeId).toBeGreaterThan(0)

    const response = await app.inject({
      method: 'DELETE',
      url: `/accounts/detail/${createdEmployeeId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    createdEmployeeId = 0 // Mark as deleted
  })

  it('returns error for non-existent account', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/accounts/detail/999999',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBeGreaterThanOrEqual(400)
  })
})

describe('GET /accounts/me', () => {
  it('returns owner profile', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts/me',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.email).toBe('admin@order.com')
    expect(response.json().data.role).toBe('Owner')
  })

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts/me'
    })

    expect(response.statusCode).toBe(401)
  })
})
