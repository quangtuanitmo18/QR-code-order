import { AuthError, EntityError, ForbiddenError, StatusError, isPrismaClientKnownRequestError } from '@/utils/errors'
import { describe, expect, it } from 'vitest'

describe('Error classes', () => {
  describe('EntityError', () => {
    it('sets status 422 and stores fields', () => {
      const fields = [
        { message: 'Email is required', field: 'email' },
        { message: 'Name is too short', field: 'name' }
      ]
      const error = new EntityError(fields)

      expect(error.status).toBe(422)
      expect(error.fields).toEqual(fields)
      expect(error.message).toBe('EntityError')
      expect(error).toBeInstanceOf(Error)
    })

    it('works with empty fields array', () => {
      const error = new EntityError([])
      expect(error.fields).toEqual([])
      expect(error.status).toBe(422)
    })
  })

  describe('AuthError', () => {
    it('sets status 401 and custom message', () => {
      const error = new AuthError('Invalid token')
      expect(error.status).toBe(401)
      expect(error.message).toBe('Invalid token')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('ForbiddenError', () => {
    it('sets status 403 and custom message', () => {
      const error = new ForbiddenError('Access denied')
      expect(error.status).toBe(403)
      expect(error.message).toBe('Access denied')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('StatusError', () => {
    it('uses custom status and message', () => {
      const error = new StatusError({ message: 'Not Found', status: 404 })
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not Found')
    })

    it('works with 500 status', () => {
      const error = new StatusError({ message: 'Internal error', status: 500 })
      expect(error.status).toBe(500)
    })
  })

  describe('isPrismaClientKnownRequestError', () => {
    it('returns false for a plain Error', () => {
      expect(isPrismaClientKnownRequestError(new Error('test'))).toBe(false)
    })

    it('returns false for non-error values', () => {
      expect(isPrismaClientKnownRequestError(null)).toBe(false)
      expect(isPrismaClientKnownRequestError(undefined)).toBe(false)
      expect(isPrismaClientKnownRequestError('string')).toBe(false)
      expect(isPrismaClientKnownRequestError(42)).toBe(false)
    })
  })
})
