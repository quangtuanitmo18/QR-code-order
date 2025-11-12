// client/src/lib/currency.ts

const USD_TO_VND_RATE = 25000
const USD_TO_RUB_RATE = 95

export async function convertUSDtoVND(usdAmount: number): Promise<number> {
  return Math.round(usdAmount * (await getLiveExchangeRate('VND')))
}

export async function convertUSDtoRUB(usdAmount: number): Promise<number> {
  return Math.round(usdAmount * (await getLiveExchangeRate('RUB')) * 100) / 100
}

export async function convertVNDtoUSD(vndAmount: number): Promise<number> {
  return Math.round((vndAmount / (await getLiveExchangeRate('VND'))) * 100) / 100
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function formatRUB(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(amount)
}

export async function getLiveExchangeRate(targetCurrency: 'VND' | 'RUB' = 'VND'): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()

    if (targetCurrency === 'RUB') {
      console.log('RUB rate:', data.rates.RUB)
      return data.rates.RUB || USD_TO_RUB_RATE
    }

    console.log('VND rate:', data.rates.VND)
    return data.rates.VND || USD_TO_VND_RATE
  } catch (error) {
    console.error('Failed to fetch exchange rate, using default:', error)
    return targetCurrency === 'RUB' ? USD_TO_RUB_RATE : USD_TO_VND_RATE
  }
}
