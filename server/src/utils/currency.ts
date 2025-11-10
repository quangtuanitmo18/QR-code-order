// server/src/utils/currency.ts (file mới)

export async function convertUSDtoVND(usdAmount: number): Promise<number> {
  const USD_TO_VND_RATE = await getLiveExchangeRate()
  return Math.round(usdAmount * USD_TO_VND_RATE)
}

export async function getLiveExchangeRate(): Promise<number> {
  try {
    // Có thể dùng API như exchangerate-api.com, fixer.io...
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()
    return data.rates.VND || 25000
  } catch (error) {
    console.error('Failed to fetch exchange rate, using default:', error)
    return 25000
  }
}