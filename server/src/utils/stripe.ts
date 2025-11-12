import envConfig from '@/config'
import Stripe from 'stripe'

// Initialize Stripe with test API key
export const stripe = new Stripe(envConfig.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover', // Use supported API version
  typescript: true
})

/**
 * Create Stripe Checkout Session
 * @param amount - Amount in USD cents (e.g., 1050 = $10.50)
 * @param transactionRef - Internal transaction reference
 * @param description - Payment description (e.g., "Payment for 3 dishes")
 * @param returnUrl - URL to redirect after payment
 * @param guestEmail - Optional guest email
 * @returns Stripe Checkout Session object
 */
export const createStripeCheckoutSession = async ({
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
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount, // Amount in cents
            product_data: {
              name: 'Restaurant Order Payment',
              description
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        transactionRef,
        source: 'restaurant-order-system'
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=false`,
      customer_email: guestEmail,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60 // 30 minutes
    })

    return session
  } catch (error: any) {
    console.error('Stripe checkout session creation failed:', error)
    throw new Error(`Failed to create Stripe checkout session: ${error.message}`)
  }
}

/**
 * Verify Stripe Webhook Signature
 * @param payload - Raw request body (string or Buffer)
 * @param signature - stripe-signature header value
 * @returns Verified Stripe Event object
 * @throws Error if signature is invalid
 */
export const verifyStripeWebhook = (payload: string | Buffer, signature: string): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(payload, signature, envConfig.STRIPE_WEBHOOK_SECRET)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error)
    throw new Error(`Webhook signature verification failed: ${error.message}`)
  }
}

/**
 * Retrieve Stripe Checkout Session
 * @param sessionId - Stripe session ID (cs_test_xxx)
 * @returns Stripe Session object
 */
export const getStripeSession = async (sessionId: string) => {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'] // Include payment intent details
    })
  } catch (error: any) {
    console.error('Failed to retrieve Stripe session:', error)
    throw new Error(`Failed to retrieve Stripe session: ${error.message}`)
  }
}
