import { comparePassword, hashPassword } from '@/utils/crypto'
import { describe, expect, it } from 'vitest'

describe('Crypto utilities', () => {
  const password = 'MySecret123!'

  describe('hashPassword', () => {
    it('returns a bcrypt hash string', async () => {
      const hash = await hashPassword(password)
      expect(typeof hash).toBe('string')
      // bcrypt hashes start with $2b$ or $2a$
      expect(hash).toMatch(/^\$2[ab]\$/)
    })

    it('produces different hashes for the same password (salted)', async () => {
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('comparePassword', () => {
    it('returns true for matching password', async () => {
      const hash = await hashPassword(password)
      const result = await comparePassword(password, hash)
      expect(result).toBe(true)
    })

    it('returns false for wrong password', async () => {
      const hash = await hashPassword(password)
      const result = await comparePassword('WrongPassword', hash)
      expect(result).toBe(false)
    })

    it('returns false for empty password', async () => {
      const hash = await hashPassword(password)
      const result = await comparePassword('', hash)
      expect(result).toBe(false)
    })
  })
})
