import { DishStatus } from '@/constants/type'
import { CreateDishBody, DishParams, DishSchema } from '@/schemaValidations/dish.schema'
import { describe, expect, it } from 'vitest'

describe('CreateDishBody', () => {
  const validDish = {
    name: 'Phở Bò Tái',
    price: 85000,
    description: 'Beef pho with rare steak',
    image: 'https://example.com/pho.jpg',
    category: 'Main Course',
  }

  it('accepts valid dish data', () => {
    const result = CreateDishBody.safeParse(validDish)
    expect(result.success).toBe(true)
  })

  it('accepts dish with status', () => {
    const result = CreateDishBody.safeParse({ ...validDish, status: DishStatus.Available })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = CreateDishBody.safeParse({ ...validDish, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = CreateDishBody.safeParse({ ...validDish, price: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects zero price', () => {
    const result = CreateDishBody.safeParse({ ...validDish, price: 0 })
    expect(result.success).toBe(false)
  })

  it('coerces string price to number', () => {
    const result = CreateDishBody.safeParse({ ...validDish, price: '50000' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(50000)
    }
  })

  it('rejects invalid image URL', () => {
    const result = CreateDishBody.safeParse({ ...validDish, image: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects empty category', () => {
    const result = CreateDishBody.safeParse({ ...validDish, category: '' })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only category', () => {
    const result = CreateDishBody.safeParse({ ...validDish, category: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status value', () => {
    const result = CreateDishBody.safeParse({ ...validDish, status: 'InvalidStatus' })
    expect(result.success).toBe(false)
  })
})

describe('DishSchema', () => {
  it('accepts valid dish with all fields', () => {
    const result = DishSchema.safeParse({
      id: 1,
      name: 'Phở Bò',
      price: 85000,
      description: 'Delicious',
      image: 'https://example.com/img.jpg',
      category: 'Main Course',
      status: DishStatus.Available,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = DishSchema.safeParse({
      id: 1,
      name: 'Test',
      price: 10000,
      description: '',
      image: '',
      status: 'BadStatus',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(result.success).toBe(false)
  })
})

describe('DishParams', () => {
  it('coerces string id to number', () => {
    const result = DishParams.safeParse({ id: '5' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(5)
    }
  })
})
