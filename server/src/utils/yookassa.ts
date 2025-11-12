import envConfig from '@/config'

// Lazy load YooKassa SDK
let YooKassaSDK: any = null

async function getYooKassaSDK() {
  if (!YooKassaSDK) {
    YooKassaSDK = await import('@appigram/yookassa-node').then((mod) => mod.YooKassa)
  }
  return YooKassaSDK
}

/**
 * Get YooKassa client instance
 */
async function getYooKassaClient() {
  const YooKassa = await getYooKassaSDK()
  return new YooKassa({
    shopId: envConfig.YOOKASSA_SHOP_ID,
    secretKey: envConfig.YOOKASSA_SECRET_KEY
  })
}

/**
 * Create YooKassa Payment
 * @param amount - Amount in RUB (e.g., 950.50)
 * @param transactionRef - Internal transaction reference
 * @param description - Payment description
 * @param returnUrl - URL to redirect after payment
 * @param guestEmail - Optional guest email
 * @returns YooKassa Payment object
 */
export const createYooKassaPayment = async ({
  amount,
  transactionRef,
  description,
  returnUrl,
  guestEmail
}: {
  amount: number
  transactionRef: string
  description: string
  returnUrl: string
  guestEmail?: string
}) => {
  try {
    const yookassa = await getYooKassaClient()

    // Payment configuration WITHOUT payment_orders
    // Note: payment_orders is ONLY for GIS ZhKKh utility payments (electricity, water, gas)
    // For restaurant/e-commerce, DISABLE "Accept utility payments" in YooKassa Dashboard
    const paymentConfig: any = {
      amount: {
        value: amount.toFixed(2), // YooKassa requires string with 2 decimal places
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl
      },
      capture: true, // Auto-capture payment
      description,
      metadata: {
        transactionRef,
        source: 'restaurant-order-system'
      }
      // ⚠️ payment_orders removed - causes errors with test accounts
      // If you see GIS ZhKKh errors, disable "Accept utility payments" in YooKassa Dashboard:
      // Settings → Shop → Payment Settings → Turn OFF "Принимаю платежи за ЖКУ"
    }

    console.log('Creating YooKassa payment:', {
      amount: paymentConfig.amount,
      transactionRef,
      returnUrl
    })

    const payment = await yookassa.createPayment(paymentConfig)

    console.log('YooKassa payment created successfully:', {
      id: payment.id,
      status: payment.status,
      confirmation_url: payment.confirmation?.confirmation_url
    })

    return payment
  } catch (error: any) {
    console.error('YooKassa payment creation failed:', error)

    // Log detailed error information
    if (error.response?.data) {
      console.error('YooKassa API Error:', JSON.stringify(error.response.data, null, 2))
    }

    throw new Error(`Failed to create YooKassa payment: ${error.message}`)
  }
}

/**
 * Retrieve YooKassa Payment
 * @param paymentId - YooKassa payment ID
 * @returns YooKassa Payment object
 */
export const getYooKassaPayment = async (paymentId: string) => {
  try {
    const yookassa = await getYooKassaClient()
    return await yookassa.getPayment(paymentId)
  } catch (error: any) {
    console.error('Failed to retrieve YooKassa payment:', error)
    throw new Error(`Failed to retrieve YooKassa payment: ${error.message}`)
  }
}

/**
 * Verify YooKassa Webhook Notification
 * YooKassa gửi webhook với Basic Auth header: Authorization: Basic base64(shopId:secretKey)
 * @param authHeader - Authorization header value
 * @param body - Webhook notification body
 * @returns Verified notification object
 */
export const verifyYooKassaWebhook = (authHeader: string | undefined, body: any) => {
  try {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new Error('Invalid authorization header')
    }

    // Decode Basic Auth
    const base64Credentials = authHeader.split(' ')[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [shopId, secretKey] = credentials.split(':')

    // Verify credentials
    if (shopId !== envConfig.YOOKASSA_SHOP_ID || secretKey !== envConfig.YOOKASSA_SECRET_KEY) {
      throw new Error('Invalid credentials')
    }

    // Validate notification structure
    if (!body || !body.type || !body.object) {
      throw new Error('Invalid notification structure')
    }

    return body
  } catch (error: any) {
    console.error('YooKassa webhook verification failed:', error)
    throw new Error(`Webhook verification failed: ${error.message}`)
  }
}

/**
 * Get payment status from YooKassa notification
 * @param notification - YooKassa notification object
 * @returns 'pending' | 'succeeded' | 'canceled'
 */
export const getYooKassaPaymentStatus = (notification: any): string => {
  return notification.object?.status || 'pending'
}
