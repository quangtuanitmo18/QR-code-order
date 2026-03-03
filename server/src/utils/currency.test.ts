import { convertUSDtoRUB, convertUSDtoVND, getLiveExchangeRate } from '@/utils/currency'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Currency utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getLiveExchangeRate', () => {
    it('returns VND rate from API', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({ rates: { VND: 24500, RUB: 90 } })
      } as Response)

      const rate = await getLiveExchangeRate('VND')
      expect(rate).toBe(24500)
    })

    it('returns RUB rate from API', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({ rates: { VND: 24500, RUB: 90 } })
      } as Response)

      const rate = await getLiveExchangeRate('RUB')
      expect(rate).toBe(90)
    })

    it('returns default VND rate on fetch failure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      const rate = await getLiveExchangeRate('VND')
      expect(rate).toBe(25000)
    })

    it('returns default RUB rate on fetch failure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      const rate = await getLiveExchangeRate('RUB')
      expect(rate).toBe(95)
    })

    it('defaults to VND when no arg provided', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({ rates: { VND: 24000 } })
      } as Response)

      const rate = await getLiveExchangeRate()
      expect(rate).toBe(24000)
    })
  })

  describe('convertUSDtoVND', () => {
    it('converts correctly with mocked rate', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({ rates: { VND: 25000 } })
      } as Response)

      const result = await convertUSDtoVND(10)
      expect(result).toBe(250000)
    })

    it('rounds to nearest integer', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({ rates: { VND: 24567 } })
      } as Response)

      const result = await convertUSDtoVND(1.5)
      // 1.5 * 24567 = 36850.5 → Math.round → 36851
      expect(result).toBe(36851)
    })
  })

  describe('convertUSDtoRUB', () => {
    it('converts correctly with mocked rate', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({ rates: { RUB: 95 } })
      } as Response)

      const result = await convertUSDtoRUB(10)
      expect(result).toBe(950)
    })

    it('rounds to 2 decimal places', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({ rates: { RUB: 93.45 } })
      } as Response)

      const result = await convertUSDtoRUB(1.33)
      // 1.33 * 93.45 = 124.2885 → round(* 100)/100 = 124.29
      expect(result).toBe(124.29)
    })
  })
})
