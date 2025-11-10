// client/src/lib/currency.ts

const USD_TO_VND_RATE = 25000

export async function convertUSDtoVND(usdAmount: number): Promise<number> {
  return Math.round(usdAmount * (await getLiveExchangeRate()))
}

export  async function convertVNDtoUSD(vndAmount: number): Promise<number> {
  return Math.round((vndAmount / (await getLiveExchangeRate())) * 100) / 100
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

export async function getLiveExchangeRate(): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()
    console.log('data', data.rates.VND)
    return data.rates.VND || 25000
  } catch (error) {
    console.error('Failed to fetch exchange rate, using default:', error)
    return 25000
  }
}