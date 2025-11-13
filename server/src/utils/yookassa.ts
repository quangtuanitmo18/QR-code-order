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
 * Verifies webhook by validating structure and checking payment exists in YooKassa
 * @param signature - Signature header value (for future ECDSA verification)
 * @param body - Webhook notification body
 * @returns Verified notification object
 */
export async function verifyYooKassaWebhook(signature: string, body: any) {
  try {
    console.log('🔍 Verifying YooKassa webhook notification')

    // Validate notification structure
    if (!body.type || body.type !== 'notification') {
      throw new Error(`Invalid notification type: ${body.type}`)
    }

    if (!body.event) {
      throw new Error('Missing event field in notification')
    }

    if (!body.object?.id) {
      throw new Error('Missing payment ID in notification')
    }

    const paymentId = body.object.id

    console.log('📋 Notification details:', {
      type: body.type,
      event: body.event,
      paymentId,
      status: body.object?.status
    })

    // Verify payment exists in YooKassa by fetching it
    // This ensures the webhook is legitimate
    const yookassa = await getYooKassaClient()

    let payment
    try {
      payment = await yookassa.getPayment(paymentId)
      console.log('✅ Payment fetched from YooKassa:', JSON.stringify(payment, null, 2))
    } catch (fetchError: any) {
      console.error('❌ Failed to fetch payment from YooKassa:', fetchError.message)
      throw new Error(`Cannot verify payment ${paymentId}: ${fetchError.message}`)
    }

    if (!payment || !payment.id) {
      throw new Error(`Payment ${paymentId} not found in YooKassa`)
    }

    console.log('✅ Webhook verified - payment exists in YooKassa:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount?.value
    })

    // Additional security: Check payment status matches notification
    if (payment.status !== body.object.status) {
      console.warn('⚠️ Payment status mismatch:', {
        notificationStatus: body.object.status,
        actualStatus: payment.status
      })
    }

    return body
  } catch (error: any) {
    console.error('❌ Webhook verification failed:', error.message)
    throw error
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
