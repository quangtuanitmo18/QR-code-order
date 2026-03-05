import { requireEmployeeHook, requireGuestHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { AuthError } from '@/utils/errors'
import { signAccessToken } from '@/utils/jwt'
import { FastifyRequest } from 'fastify'
import { describe, expect, it } from 'vitest'

/**
 * Tests for auth hooks (Fastify preValidation hooks).
 *
 * These hooks extract and verify JWT tokens from the Authorization header
 * and enforce role-based access control.
 */

function createMockRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
  return {
    headers: {},
    decodedAccessToken: undefined,
    ...overrides
  } as unknown as FastifyRequest
}

describe('Auth Hooks', () => {
  describe('requireLoginedHook', () => {
    it('throws AuthError when no authorization header', async () => {
      const request = createMockRequest()
      await expect(requireLoginedHook(request)).rejects.toThrow(AuthError)
    })

    it('throws AuthError when authorization header has no token', async () => {
      const request = createMockRequest({
        headers: { authorization: 'Bearer ' }
      })
      // 'Bearer '.split(' ')[1] === '' which is falsy
      await expect(requireLoginedHook(request)).rejects.toThrow(AuthError)
    })

    it('throws AuthError for invalid token', async () => {
      const request = createMockRequest({
        headers: { authorization: 'Bearer invalid-token' }
      })
      await expect(requireLoginedHook(request)).rejects.toThrow(AuthError)
    })

    it('sets decodedAccessToken for valid token', async () => {
      const token = signAccessToken({ userId: 42, role: 'Owner' })
      const request = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      })

      await requireLoginedHook(request)

      expect(request.decodedAccessToken).toBeDefined()
      expect(request.decodedAccessToken!.userId).toBe(42)
      expect(request.decodedAccessToken!.role).toBe('Owner')
    })
  })

  describe('requireOwnerHook', () => {
    it('passes when role is Owner', async () => {
      const request = createMockRequest()
      request.decodedAccessToken = { userId: 1, role: 'Owner', tokenType: 'AccessToken', iat: 0, exp: 0 }
      await expect(requireOwnerHook(request)).resolves.not.toThrow()
    })

    it('throws AuthError when role is Employee', async () => {
      const request = createMockRequest()
      request.decodedAccessToken = { userId: 1, role: 'Employee', tokenType: 'AccessToken', iat: 0, exp: 0 }
      await expect(requireOwnerHook(request)).rejects.toThrow(AuthError)
    })

    it('throws AuthError when role is Guest', async () => {
      const request = createMockRequest()
      request.decodedAccessToken = { userId: 1, role: 'Guest', tokenType: 'AccessToken', iat: 0, exp: 0 }
      await expect(requireOwnerHook(request)).rejects.toThrow(AuthError)
    })
  })

  describe('requireEmployeeHook', () => {
    it('passes when role is Employee', async () => {
      const request = createMockRequest()
      request.decodedAccessToken = { userId: 1, role: 'Employee', tokenType: 'AccessToken', iat: 0, exp: 0 }
      await expect(requireEmployeeHook(request)).resolves.not.toThrow()
    })

    it('throws AuthError when role is Owner', async () => {
      const request = createMockRequest()
      request.decodedAccessToken = { userId: 1, role: 'Owner', tokenType: 'AccessToken', iat: 0, exp: 0 }
      await expect(requireEmployeeHook(request)).rejects.toThrow(AuthError)
    })
  })

  describe('requireGuestHook', () => {
    it('passes when role is Guest', async () => {
      const request = createMockRequest()
      request.decodedAccessToken = { userId: 1, role: 'Guest', tokenType: 'AccessToken', iat: 0, exp: 0 }
      await expect(requireGuestHook(request)).resolves.not.toThrow()
    })

    it('throws AuthError when role is Owner', async () => {
      const request = createMockRequest()
      request.decodedAccessToken = { userId: 1, role: 'Owner', tokenType: 'AccessToken', iat: 0, exp: 0 }
      await expect(requireGuestHook(request)).rejects.toThrow(AuthError)
    })
  })
})
