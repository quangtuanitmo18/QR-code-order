import { describe, expect, it } from 'vitest'
import {
    LoginBody,
    LoginRes,
    LogoutBody,
    RefreshTokenBody
} from './auth.schema'

describe('LoginBody schema', () => {
  it('validates a valid login body', () => {
    const result = LoginBody.safeParse({
      email: 'admin@test.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = LoginBody.safeParse({ email: '', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('required')
    }
  })

  it('rejects invalid email format', () => {
    const result = LoginBody.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('invalidEmail')
    }
  })

  it('rejects password shorter than 6 characters', () => {
    const result = LoginBody.safeParse({ email: 'admin@test.com', password: '12345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('minmaxPassword')
    }
  })

  it('rejects extra fields (strict mode)', () => {
    const result = LoginBody.safeParse({
      email: 'admin@test.com',
      password: 'password123',
      extra: 'field',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing password field', () => {
    const result = LoginBody.safeParse({ email: 'admin@test.com' })
    expect(result.success).toBe(false)
  })
})

describe('LoginRes schema', () => {
  it('validates a valid login response', () => {
    const result = LoginRes.safeParse({
      data: {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        account: {
          id: 1,
          name: 'John Doe',
          email: 'john@test.com',
          role: 'Owner',
          avatar: null,
        },
      },
      message: 'Đăng nhập thành công',
    })
    expect(result.success).toBe(true)
  })

  it('rejects response missing accessToken', () => {
    const result = LoginRes.safeParse({
      data: {
        refreshToken: 'refresh-token-456',
        account: { id: 1, name: 'John', email: 'j@t.com', role: 'Owner', avatar: null },
      },
      message: 'ok',
    })
    expect(result.success).toBe(false)
  })
})

describe('RefreshTokenBody schema', () => {
  it('validates a valid refresh token body', () => {
    const result = RefreshTokenBody.safeParse({ refreshToken: 'some-token' })
    expect(result.success).toBe(true)
  })

  it('rejects extra fields (strict mode)', () => {
    const result = RefreshTokenBody.safeParse({ refreshToken: 'token', extra: true })
    expect(result.success).toBe(false)
  })
})

describe('LogoutBody schema', () => {
  it('validates a valid logout body', () => {
    const result = LogoutBody.safeParse({ refreshToken: 'some-token' })
    expect(result.success).toBe(true)
  })
})
