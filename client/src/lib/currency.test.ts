import { formatRUB, formatUSD, formatVND, getLiveExchangeRate } from '@/lib/currency'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('formatUSD', () => {
  it('formats positive amount', () => {
    const result = formatUSD(12.5)
    expect(result).toContain('12.50')
    expect(result).toContain('$')
  })

  it('formats zero', () => {
    expect(formatUSD(0)).toContain('0.00')
  })

  it('formats large amount with comma grouping', () => {
    const result = formatUSD(1234.56)
    expect(result).toContain('1,234.56')
  })
})

describe('formatVND', () => {
  it('formats amount in VND', () => {
    const result = formatVND(85000)
    // VND uses comma or dot grouping depending on locale
    expect(result).toContain('85')
    expect(result).toMatch(/₫|VND/)
  })

  it('formats zero', () => {
    const result = formatVND(0)
    expect(result).toContain('0')
  })
})

describe('formatRUB', () => {
  it('formats amount in RUB', () => {
    const result = formatRUB(1500)
    expect(result).toContain('1')
    expect(result).toContain('500')
  })
})

describe('getLiveExchangeRate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns VND rate from API on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ rates: { VND: 25500, RUB: 96 } }),
    } as Response)

    const rate = await getLiveExchangeRate('VND')
    expect(rate).toBe(25500)
  })

  it('returns RUB rate from API on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ rates: { VND: 25500, RUB: 96 } }),
    } as Response)

    const rate = await getLiveExchangeRate('RUB')
    expect(rate).toBe(96)
  })

  it('returns default VND rate on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const rate = await getLiveExchangeRate('VND')
    expect(rate).toBe(25000) // default USD_TO_VND_RATE
  })

  it('returns default RUB rate on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const rate = await getLiveExchangeRate('RUB')
    expect(rate).toBe(95) // default USD_TO_RUB_RATE
  })

  it('defaults to VND if no currency specified', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ rates: { VND: 24000, RUB: 90 } }),
    } as Response)

    const rate = await getLiveExchangeRate()
    expect(rate).toBe(24000)
  })
})
