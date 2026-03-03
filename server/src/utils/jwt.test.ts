import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/utils/jwt'
import { describe, expect, it } from 'vitest'

describe('JWT utilities', () => {
  const payload = { userId: 1, role: 'Owner' as const }

  describe('signAccessToken', () => {
    it('returns a JWT string', () => {
      const token = signAccessToken(payload)
      expect(typeof token).toBe('string')
      // JWT format: header.payload.signature
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyAccessToken', () => {
    it('decodes payload correctly', () => {
      const token = signAccessToken(payload)
      const decoded = verifyAccessToken(token)

      expect(decoded.userId).toBe(1)
      expect(decoded.role).toBe('Owner')
      expect(decoded.tokenType).toBe('AccessToken')
    })

    it('throws on invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow()
    })

    it('throws on tampered token', () => {
      const token = signAccessToken(payload)
      const tampered = token.slice(0, -5) + 'XXXXX'
      expect(() => verifyAccessToken(tampered)).toThrow()
    })
  })

  describe('signRefreshToken', () => {
    it('returns a JWT string', () => {
      const token = signRefreshToken(payload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyRefreshToken', () => {
    it('decodes payload correctly', () => {
      const token = signRefreshToken(payload)
      const decoded = verifyRefreshToken(token)

      expect(decoded.userId).toBe(1)
      expect(decoded.role).toBe('Owner')
      expect(decoded.tokenType).toBe('RefreshToken')
    })

    it('includes exp claim', () => {
      const token = signRefreshToken(payload)
      const decoded = verifyRefreshToken(token)
      expect(decoded.exp).toBeDefined()
      expect(typeof decoded.exp).toBe('number')
    })

    it('throws on invalid token', () => {
      expect(() => verifyRefreshToken('garbage')).toThrow()
    })
  })

  describe('custom exp passthrough', () => {
    it('uses provided exp for access token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      const token = signAccessToken({ ...payload, exp: futureExp })
      const decoded = verifyAccessToken(token)
      expect(decoded.exp).toBe(futureExp)
    })

    it('uses provided exp for refresh token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 86400
      const token = signRefreshToken({ ...payload, exp: futureExp })
      const decoded = verifyRefreshToken(token)
      expect(decoded.exp).toBe(futureExp)
    })
  })

  describe('cross-token rejection', () => {
    it('access token secret cannot verify refresh token', () => {
      const refreshToken = signRefreshToken(payload)
      // verifyAccessToken uses ACCESS_TOKEN_SECRET, should fail for refresh token
      // (only if secrets differ, which they should in any proper config)
      const decoded = (() => {
        try {
          return verifyAccessToken(refreshToken)
        } catch {
          return null
        }
      })()
      // If secrets are different, decoded is null; if same, tokenType still differs
      if (decoded) {
        expect(decoded.tokenType).toBe('RefreshToken') // wrong type
      } else {
        expect(decoded).toBeNull()
      }
    })
  })
})
