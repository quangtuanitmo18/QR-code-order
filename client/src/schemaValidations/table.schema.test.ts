import { TableStatus } from '@/constants/type'
import { CreateTableBody, TableParams, UpdateTableBody } from '@/schemaValidations/table.schema'
import { describe, expect, it } from 'vitest'

describe('CreateTableBody', () => {
  it('accepts valid table data', () => {
    const result = CreateTableBody.safeParse({ number: 1, capacity: 4 })
    expect(result.success).toBe(true)
  })

  it('coerces string values to numbers', () => {
    const result = CreateTableBody.safeParse({ number: '5', capacity: '8' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.number).toBe(5)
      expect(result.data.capacity).toBe(8)
    }
  })

  it('rejects zero or negative number', () => {
    expect(CreateTableBody.safeParse({ number: 0, capacity: 4 }).success).toBe(false)
    expect(CreateTableBody.safeParse({ number: -1, capacity: 4 }).success).toBe(false)
  })

  it('rejects zero or negative capacity', () => {
    expect(CreateTableBody.safeParse({ number: 1, capacity: 0 }).success).toBe(false)
    expect(CreateTableBody.safeParse({ number: 1, capacity: -2 }).success).toBe(false)
  })

  it('accepts optional status', () => {
    const result = CreateTableBody.safeParse({
      number: 1,
      capacity: 4,
      status: TableStatus.Reserved,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = CreateTableBody.safeParse({
      number: 1,
      capacity: 4,
      status: 'Occupied',
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdateTableBody', () => {
  it('accepts valid update', () => {
    const result = UpdateTableBody.safeParse({ changeToken: false, capacity: 6 })
    expect(result.success).toBe(true)
  })

  it('accepts update with status change', () => {
    const result = UpdateTableBody.safeParse({
      changeToken: true,
      capacity: 4,
      status: TableStatus.Hidden,
    })
    expect(result.success).toBe(true)
  })
})

describe('TableParams', () => {
  it('coerces string to number', () => {
    const result = TableParams.safeParse({ number: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.number).toBe(10)
    }
  })
})
