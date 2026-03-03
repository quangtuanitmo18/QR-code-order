import { Role } from '@/constants/type'
import {
    AccountSchema,
    ChangePasswordBody,
    CreateEmployeeAccountBody,
    CreateGuestBody,
    UpdateEmployeeAccountBody,
    UpdateMeBody,
} from '@/schemaValidations/account.schema'
import { describe, expect, it } from 'vitest'

describe('AccountSchema', () => {
  it('accepts valid account data', () => {
    const result = AccountSchema.safeParse({
      id: 1,
      name: 'Admin',
      email: 'admin@order.com',
      role: Role.Owner,
      avatar: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts Employee role', () => {
    const result = AccountSchema.safeParse({
      id: 2,
      name: 'Employee',
      email: 'emp@order.com',
      role: Role.Employee,
      avatar: 'https://example.com/avatar.png',
    })
    expect(result.success).toBe(true)
  })

  it('rejects Guest role', () => {
    const result = AccountSchema.safeParse({
      id: 3,
      name: 'Guest',
      email: 'guest@test.com',
      role: Role.Guest,
      avatar: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('CreateEmployeeAccountBody', () => {
  const validData = {
    name: 'New Employee',
    email: 'new@order.com',
    password: '123456',
    confirmPassword: '123456',
  }

  it('accepts valid employee creation data', () => {
    const result = CreateEmployeeAccountBody.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = CreateEmployeeAccountBody.safeParse({
      ...validData,
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmErr = result.error.errors.find((e) => e.path.includes('confirmPassword'))
      expect(confirmErr).toBeDefined()
    }
  })

  it('rejects name shorter than 2 characters', () => {
    const result = CreateEmployeeAccountBody.safeParse({ ...validData, name: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = CreateEmployeeAccountBody.safeParse({ ...validData, email: 'not-email' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 6 characters', () => {
    const result = CreateEmployeeAccountBody.safeParse({
      ...validData,
      password: '123',
      confirmPassword: '123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects extra fields (strict mode)', () => {
    const result = CreateEmployeeAccountBody.safeParse({
      ...validData,
      extraField: 'should fail',
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdateEmployeeAccountBody', () => {
  const validData = {
    name: 'Updated Employee',
    email: 'updated@order.com',
  }

  it('accepts valid update without password change', () => {
    const result = UpdateEmployeeAccountBody.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('accepts valid update with password change', () => {
    const result = UpdateEmployeeAccountBody.safeParse({
      ...validData,
      changePassword: true,
      password: '123456',
      confirmPassword: '123456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when changePassword=true but no passwords provided', () => {
    const result = UpdateEmployeeAccountBody.safeParse({
      ...validData,
      changePassword: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects when changePassword=true but passwords mismatch', () => {
    const result = UpdateEmployeeAccountBody.safeParse({
      ...validData,
      changePassword: true,
      password: '123456',
      confirmPassword: '654321',
    })
    expect(result.success).toBe(false)
  })

  it('defaults role to Employee if not provided', () => {
    const result = UpdateEmployeeAccountBody.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe(Role.Employee)
    }
  })
})

describe('ChangePasswordBody', () => {
  it('accepts valid password change', () => {
    const result = ChangePasswordBody.safeParse({
      oldPassword: 'old123',
      password: 'new123',
      confirmPassword: 'new123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when new passwords do not match', () => {
    const result = ChangePasswordBody.safeParse({
      oldPassword: 'old123',
      password: 'new123',
      confirmPassword: 'mismatch',
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdateMeBody', () => {
  it('accepts valid profile update', () => {
    const result = UpdateMeBody.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('accepts profile with avatar URL', () => {
    const result = UpdateMeBody.safeParse({
      name: 'New Name',
      avatar: 'https://example.com/avatar.jpg',
    })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = UpdateMeBody.safeParse({ name: 'A' })
    expect(result.success).toBe(false)
  })
})

describe('CreateGuestBody', () => {
  it('accepts valid guest data', () => {
    const result = CreateGuestBody.safeParse({ name: 'Guest User', tableNumber: 5 })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = CreateGuestBody.safeParse({ name: 'G', tableNumber: 1 })
    expect(result.success).toBe(false)
  })

  it('rejects extra fields (strict mode)', () => {
    const result = CreateGuestBody.safeParse({
      name: 'Guest',
      tableNumber: 1,
      extra: 'should fail',
    })
    expect(result.success).toBe(false)
  })
})
