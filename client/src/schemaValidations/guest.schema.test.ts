import { GuestCreateOrdersBody, GuestLoginBody } from '@/schemaValidations/guest.schema'
import { describe, expect, it } from 'vitest'

describe('GuestLoginBody', () => {
  const validData = { name: 'Guest User', tableNumber: 5, token: 'abc123' }

  it('accepts valid guest login data', () => {
    const result = GuestLoginBody.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = GuestLoginBody.safeParse({ ...validData, name: 'G' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 50 chars', () => {
    const result = GuestLoginBody.safeParse({ ...validData, name: 'A'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('rejects missing token', () => {
    const result = GuestLoginBody.safeParse({ name: 'Guest', tableNumber: 1 })
    expect(result.success).toBe(false)
  })

  it('rejects extra fields (strict mode)', () => {
    const result = GuestLoginBody.safeParse({ ...validData, extra: 'nope' })
    expect(result.success).toBe(false)
  })
})

describe('GuestCreateOrdersBody', () => {
  it('accepts valid order array', () => {
    const result = GuestCreateOrdersBody.safeParse([
      { dishId: 1, quantity: 2 },
      { dishId: 3, quantity: 1 },
    ])
    expect(result.success).toBe(true)
  })

  it('accepts empty array', () => {
    const result = GuestCreateOrdersBody.safeParse([])
    expect(result.success).toBe(true)
  })

  it('rejects items missing quantity', () => {
    const result = GuestCreateOrdersBody.safeParse([{ dishId: 1 }])
    expect(result.success).toBe(false)
  })

  it('rejects items missing dishId', () => {
    const result = GuestCreateOrdersBody.safeParse([{ quantity: 2 }])
    expect(result.success).toBe(false)
  })
})
