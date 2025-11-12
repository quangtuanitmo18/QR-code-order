// server/src/utils/currency.ts

export async function convertUSDtoVND(usdAmount: number): Promise<number> {
  const USD_TO_VND_RATE = await getLiveExchangeRate('VND')
  return Math.round(usdAmount * USD_TO_VND_RATE)
}

export async function convertUSDtoRUB(usdAmount: number): Promise<number> {
  const USD_TO_RUB_RATE = await getLiveExchangeRate('RUB')
  return Math.round(usdAmount * USD_TO_RUB_RATE * 100) / 100 // YooKassa sử dụng 2 chữ số thập phân
}

export async function getLiveExchangeRate(targetCurrency: 'VND' | 'RUB' = 'VND'): Promise<number> {
  try {
    // Có thể dùng API như exchangerate-api.com, fixer.io...
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()

    if (targetCurrency === 'RUB') {
      return data.rates.RUB || 95 // Default RUB rate ~ 95 RUB per USD
    }

    return data.rates.VND || 25000
  } catch (error) {
    console.error('Failed to fetch exchange rate, using default:', error)
    return targetCurrency === 'RUB' ? 95 : 25000
  }
}
