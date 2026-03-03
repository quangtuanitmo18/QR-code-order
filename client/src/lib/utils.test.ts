import { DishStatus, OrderStatus, TableStatus } from '@/constants/type'
import { describe, expect, it } from 'vitest'
import {
    cn,
    formatCurrency,
    generateSlugUrl,
    getDishStatus,
    getIdFromSlugUrl,
    getOrderStatus,
    getTableStatus,
    getVietnameseDishStatus,
    getVietnameseOrderStatus,
    getVietnameseTableStatus,
    normalizePath,
    removeAccents,
    simpleMatchText,
} from './utils'

describe('cn()', () => {
  it('returns a single class', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves tailwind conflicts — last class wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('ignores falsy values', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b')
  })
})

describe('normalizePath()', () => {
  it('removes leading slash', () => {
    expect(normalizePath('/foo/bar')).toBe('foo/bar')
  })

  it('leaves path without leading slash unchanged', () => {
    expect(normalizePath('foo/bar')).toBe('foo/bar')
  })
})

describe('formatCurrency()', () => {
  it('formats number as USD currency', () => {
    expect(formatCurrency(85000)).toContain('85,000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })
})

describe('getVietnameseDishStatus()', () => {
  it('returns "Có sẵn" for Available', () => {
    expect(getVietnameseDishStatus(DishStatus.Available)).toBe('Có sẵn')
  })

  it('returns "Không có sẵn" for Unavailable', () => {
    expect(getVietnameseDishStatus(DishStatus.Unavailable)).toBe('Không có sẵn')
  })

  it('returns "Ẩn" for Hidden', () => {
    expect(getVietnameseDishStatus(DishStatus.Hidden)).toBe('Ẩn')
  })
})

describe('getDishStatus()', () => {
  it('returns English status strings', () => {
    expect(getDishStatus(DishStatus.Available)).toBe('Available')
    expect(getDishStatus(DishStatus.Unavailable)).toBe('Unavailable')
    expect(getDishStatus(DishStatus.Hidden)).toBe('Hidden')
  })
})

describe('getVietnameseOrderStatus()', () => {
  it('maps all order statuses to Vietnamese', () => {
    expect(getVietnameseOrderStatus(OrderStatus.Delivered)).toBe('Đã phục vụ')
    expect(getVietnameseOrderStatus(OrderStatus.Paid)).toBe('Đã thanh toán')
    expect(getVietnameseOrderStatus(OrderStatus.Pending)).toBe('Chờ xử lý')
    expect(getVietnameseOrderStatus(OrderStatus.Processing)).toBe('Đang nấu')
    expect(getVietnameseOrderStatus(OrderStatus.Rejected)).toBe('Từ chối')
  })
})

describe('getOrderStatus()', () => {
  it('maps all order statuses to English', () => {
    expect(getOrderStatus(OrderStatus.Delivered)).toBe('Delivered')
    expect(getOrderStatus(OrderStatus.Paid)).toBe('Paid')
    expect(getOrderStatus(OrderStatus.Pending)).toBe('Pending')
    expect(getOrderStatus(OrderStatus.Processing)).toBe('Processing')
    expect(getOrderStatus(OrderStatus.Rejected)).toBe('Rejected')
  })
})

describe('getTableStatus() / getVietnameseTableStatus()', () => {
  it('returns correct English table status', () => {
    expect(getTableStatus(TableStatus.Available)).toBe('Available')
    expect(getTableStatus(TableStatus.Reserved)).toBe('Reserved')
    expect(getTableStatus(TableStatus.Hidden)).toBe('Hidden')
  })

  it('returns correct Vietnamese table status', () => {
    expect(getVietnameseTableStatus(TableStatus.Available)).toBe('Có sẵn')
    expect(getVietnameseTableStatus(TableStatus.Reserved)).toBe('Đã đặt')
    expect(getVietnameseTableStatus(TableStatus.Hidden)).toBe('Ẩn')
  })
})

describe('removeAccents()', () => {
  it('removes Vietnamese diacritics', () => {
    expect(removeAccents('Phở')).toBe('Pho')
    expect(removeAccents('đặc biệt')).toBe('dac biet')
  })

  it('handles uppercase Đ', () => {
    expect(removeAccents('Đặng')).toBe('Dang')
  })

  it('leaves ASCII strings unchanged', () => {
    expect(removeAccents('hello world')).toBe('hello world')
  })
})

describe('simpleMatchText()', () => {
  it('matches text case-insensitively', () => {
    expect(simpleMatchText('Phở Bò Tái', 'pho')).toBe(true)
  })

  it('matches ignoring accents', () => {
    expect(simpleMatchText('Phở Bò Tái', 'bò')).toBe(true)
  })

  it('returns false for non-matching text', () => {
    expect(simpleMatchText('Phở Bò Tái', 'burger')).toBe(false)
  })

  it('trims whitespace from match text', () => {
    expect(simpleMatchText('Phở Bò Tái', '  pho  ')).toBe(true)
  })
})

describe('generateSlugUrl() / getIdFromSlugUrl()', () => {
  it('generates a slug URL with id suffix', () => {
    const slug = generateSlugUrl({ name: 'Phở Bò Tái', id: 42 })
    expect(slug).toContain('-i.42')
  })

  it('extracts id from slug URL', () => {
    expect(getIdFromSlugUrl('pho-bo-tai-i.42')).toBe(42)
  })

  it('round-trips correctly', () => {
    const slug = generateSlugUrl({ name: 'Bún Bò Huế', id: 99 })
    expect(getIdFromSlugUrl(slug)).toBe(99)
  })
})
