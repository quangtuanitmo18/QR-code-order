---
phase: implementation
title: Implementation Guide
description: Technical implementation notes, patterns, and code guidelines
feature: stripe-payment-integration
---

# Implementation Guide: Stripe Payment Integration

## Development Setup

**How do we get started?**

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- SQLite database (already configured)
- Git for version control
- Text editor (VS Code recommended)

### Initial Setup Steps

1. **Get Stripe Test API Keys**

   ```bash
   # 1. Sign up for Stripe account (free): https://dashboard.stripe.com/register
   # 2. Navigate to: Developers → API keys
   # 3. Copy "Secret key" (starts with sk_test_)
   # 4. Note: Publishable key not needed (using Stripe Checkout, not Payment Element)
   ```

2. **Install Stripe SDK**

   ```bash
   cd server
   npm install stripe
   npm install --save-dev @types/stripe  # If using TypeScript
   ```

3. **Configure Environment Variables**

   ```bash
   # server/.env
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx  # Get this from Stripe CLI (step 5)
   STRIPE_RETURN_URL=http://localhost:4000/api/payments/stripe/return
   CLIENT_URL=http://localhost:3000  # Already exists
   ```

4. **Update Config Validation**

   ```typescript
   // server/src/config.ts
   const configSchema = z.object({
     // ... existing fields
     STRIPE_SECRET_KEY: z.string(),
     STRIPE_WEBHOOK_SECRET: z.string(),
     STRIPE_RETURN_URL: z.string().url(),
   })
   ```

5. **Install Stripe CLI for Webhook Testing**

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases

   # Login to Stripe
   stripe login

   # Forward webhooks to local server
   stripe listen --forward-to localhost:4000/api/payments/stripe/webhook

   # Copy the webhook signing secret (whsec_xxx) to .env
   ```

## Code Structure

**How is the code organized?**

### Directory Structure

```
server/
├── src/
│   ├── config.ts                      # [MODIFY] Add Stripe env vars
│   ├── constants/
│   │   └── type.ts                    # [MODIFY] Add "Stripe" to PaymentMethod
│   ├── controllers/
│   │   └── payment.controller.ts      # [MODIFY] Add Stripe payment logic
│   ├── routes/
│   │   └── payment.route.ts           # [MODIFY] Add Stripe routes
│   └── utils/
│       └── stripe.ts                  # [NEW] Stripe utilities

client/
├── src/
│   ├── constants/
│   │   └── type.ts                    # [MODIFY] Add "Stripe" to PaymentMethod
│   ├── app/
│   │   └── [locale]/
│   │       └── guest/
│   │           └── orders/
│   │               └── orders-cart.tsx  # [MODIFY] Add Stripe UI option
```

### File-by-File Changes

#### 1. `server/src/utils/stripe.ts` [NEW FILE]

```typescript
import Stripe from 'stripe'
import envConfig from '@/config'

// Initialize Stripe with test API key
export const stripe = new Stripe(envConfig.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia', // Use latest stable version
  typescript: true,
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
  guestEmail,
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
              description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        transactionRef,
        source: 'restaurant-order-system',
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=false`,
      customer_email: guestEmail,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
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
      expand: ['payment_intent'], // Include payment intent details
    })
  } catch (error: any) {
    console.error('Failed to retrieve Stripe session:', error)
    throw new Error(`Failed to retrieve Stripe session: ${error.message}`)
  }
}
```

#### 2. `server/src/constants/type.ts` [MODIFY]

```typescript
// Add Stripe to payment methods
export const PaymentMethod = {
  Cash: 'Cash',
  VNPay: 'VNPay',
  Stripe: 'Stripe', // NEW
} as const

export const PaymentMethodValues = ['Cash', 'VNPay', 'Stripe'] as const
```

#### 3. `server/src/controllers/payment.controller.ts` [MODIFY]

Add new function at the end of file:

```typescript
// Process Stripe Payment
const processStripePayment = async ({
  guestId,
  totalAmountUSD,
  transactionRef,
  description,
  orders,
  guest,
}: any) => {
  // Convert USD to cents (Stripe requires integer cents)
  const amountInCents = Math.round(totalAmountUSD * 100)

  // Create Stripe Checkout Session
  const session = await createStripeCheckoutSession({
    amount: amountInCents,
    transactionRef,
    description,
    returnUrl: envConfig.STRIPE_RETURN_URL,
    guestEmail: undefined, // No email field in Guest model
  })

  // Create pending payment record
  const payment = await prisma.payment.create({
    data: {
      guestId,
      tableNumber: guest?.tableNumber,
      amount: totalAmountUSD, // Store in USD (original)
      currency: 'USD',
      paymentMethod: PaymentMethod.Stripe,
      status: PaymentStatus.Pending,
      transactionRef,
      externalSessionId: session.id,
      paymentUrl: session.url,
      returnUrl: envConfig.STRIPE_RETURN_URL,
      description,
      metadata: JSON.stringify({
        stripeSessionId: session.id,
        amountInCents,
        expiresAt: new Date(session.expires_at * 1000).toISOString(),
      }),
    },
  })

  return {
    payment,
    paymentUrl: session.url,
    sessionId: session.id,
  }
}

// Verify Stripe Payment (called by webhook)
export const verifyStripePaymentController = async (
  event: Stripe.Event,
  paymentHandlerId?: number
) => {
  let payment: any = null
  let transactionRef: string = ''

  // Extract transaction ref based on event type
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    transactionRef = session.metadata?.transactionRef || ''
  } else if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    // Get session from payment intent to find transaction ref
    const sessionId = paymentIntent.metadata?.sessionId
    if (sessionId) {
      const session = await getStripeSession(sessionId)
      transactionRef = session.metadata?.transactionRef || ''
    }
  }

  if (!transactionRef) {
    throw new Error('Transaction reference not found in event')
  }

  // Find payment by transaction ref
  payment = await prisma.payment.findUnique({
    where: { transactionRef },
    include: { guest: true },
  })

  if (!payment) {
    throw new Error('Payment not found')
  }

  if (payment.status === PaymentStatus.Success) {
    // Already processed
    const orders = await prisma.order.findMany({
      where: { paymentId: payment.id },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true,
      },
    })
    return { payment, orders, socketId: null }
  }

  // Process based on event type
  const isSuccess = event.type === 'payment_intent.succeeded'
  const newStatus = isSuccess ? PaymentStatus.Success : PaymentStatus.Failed

  // Extract payment details
  let paymentDetails: any = {}
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method as string
    )

    paymentDetails = {
      externalTransactionId: paymentIntent.id,
      paymentIntentStatus: paymentIntent.status,
      last4Digits: paymentMethod.card?.last4,
      cardBrand: paymentMethod.card?.brand,
      cardType: paymentMethod.card?.funding, // "credit" | "debit"
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update payment
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        ...paymentDetails,
        paymentHandlerId,
        paidAt: isSuccess ? new Date() : null,
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          eventType: event.type,
          processedAt: new Date().toISOString(),
        }),
      },
    })

    let updatedOrders: any[] = []

    if (isSuccess) {
      // Get orders for this guest
      const orders = await tx.order.findMany({
        where: {
          guestId: payment.guestId!,
          status: {
            in: [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered],
          },
        },
      })

      // Update orders to Paid
      await tx.order.updateMany({
        where: {
          id: { in: orders.map((order) => order.id) },
        },
        data: {
          status: OrderStatus.Paid,
          orderHandlerId: paymentHandlerId,
          paymentId: payment.id,
        },
      })

      updatedOrders = await tx.order.findMany({
        where: {
          id: { in: orders.map((order) => order.id) },
        },
        include: {
          dishSnapshot: true,
          orderHandler: true,
          guest: true,
        },
      })
    }

    return { payment: updatedPayment, orders: updatedOrders }
  })

  const socketRecord = await prisma.socket.findUnique({
    where: { guestId: payment.guestId! },
  })

  return {
    payment: result.payment,
    orders: result.orders,
    socketId: socketRecord?.socketId,
  }
}
```

Modify `createPaymentController` function:

```typescript
// Add after VNPay case (around line 77)
} else if (paymentMethod === PaymentMethod.Stripe) {
  return await processStripePayment({
    guestId,
    totalAmountUSD,
    transactionRef,
    description,
    orders,
    guest
  })
}
```

Add import at top:

```typescript
import { createStripeCheckoutSession, getStripeSession } from '@/utils/stripe'
```

#### 4. `server/src/routes/payment.route.ts` [MODIFY]

Add at the beginning (around line 30, after VNPay routes):

```typescript
import { verifyStripeWebhook } from '@/utils/stripe'

// Stripe return URL (public, no auth)
fastify.get('/stripe/return', async (request, reply) => {
  try {
    const { session_id, success } = request.query as { session_id?: string; success?: string }

    if (!session_id) {
      throw new Error('Session ID is required')
    }

    // Fetch session from Stripe
    const session = await getStripeSession(session_id)
    const transactionRef = session.metadata?.transactionRef

    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { transactionRef },
    })

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
    const paymentSuccess = success === 'true' && session.payment_status === 'paid'

    const redirectUrl = `${clientUrl}/en/guest/orders/payment-result?success=${paymentSuccess}&amount=${payment?.amount || 0}&txnRef=${transactionRef}&method=Stripe`

    reply.redirect(redirectUrl)
  } catch (error: any) {
    console.error('Stripe return error:', error)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
    const redirectUrl = `${clientUrl}/en/guest/orders/payment-result?success=false&error=${encodeURIComponent(error.message)}`
    reply.redirect(redirectUrl)
  }
})

// Stripe Webhook (IPN)
fastify.post(
  '/stripe/webhook',
  {
    config: {
      rawBody: true, // Required for signature verification
    },
  },
  async (request, reply) => {
    try {
      const signature = request.headers['stripe-signature'] as string

      if (!signature) {
        reply.status(400).send({ error: 'No signature provided' })
        return
      }

      // Verify webhook signature
      const event = verifyStripeWebhook(request.rawBody!, signature)

      console.log('Stripe webhook event:', event.type)

      // Handle relevant events
      if (
        event.type === 'checkout.session.completed' ||
        event.type === 'payment_intent.succeeded'
      ) {
        const result = await verifyStripePaymentController(event)

        // Emit real-time update
        if (result.socketId) {
          fastify.io.to(result.socketId).to(ManagerRoom).emit('payment', result.orders)
        } else {
          fastify.io.to(ManagerRoom).emit('payment', result.orders)
        }
      }

      reply.send({ received: true })
    } catch (error: any) {
      console.error('Stripe webhook error:', error)
      reply.status(400).send({ error: error.message })
    }
  }
)
```

Add imports at top:

```typescript
import { getStripeSession, verifyStripeWebhook } from '@/utils/stripe'
import { verifyStripePaymentController } from '@/controllers/payment.controller'
import prisma from '@/database'
```

#### 5. `client/src/constants/type.ts` [MODIFY]

```typescript
// Add Stripe to payment methods (same as server)
export const PaymentMethod = {
  Cash: 'Cash',
  VNPay: 'VNPay',
  Stripe: 'Stripe', // NEW
} as const

export const PaymentMethodValues = ['Cash', 'VNPay', 'Stripe'] as const
```

#### 6. `client/src/app/[locale]/guest/orders/orders-cart.tsx` [MODIFY]

Around line 238, add third radio option:

```tsx
<RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value={PaymentMethod.Cash} id="cash" />
    <Label htmlFor="cash" className="cursor-pointer">
      💵 Cash Payment
    </Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value={PaymentMethod.VNPay} id="vnpay" />
    <Label htmlFor="vnpay" className="cursor-pointer">
      💳 VNPay (Auto convert to VND)
    </Label>
  </div>
  {/* NEW: Stripe option */}
  <div className="flex items-center space-x-2">
    <RadioGroupItem value={PaymentMethod.Stripe} id="stripe" />
    <Label htmlFor="stripe" className="cursor-pointer">
      💳 Stripe (Credit/Debit Card - USD)
    </Label>
  </div>
</RadioGroup>
```

Modify `handlePayment` function (around line 73):

```typescript
const handlePayment = async () => {
  // ... existing code ...

  if (selectedPaymentMethod === PaymentMethod.Stripe) {
    // Stripe redirects to checkout page
    const response = await guestApiRequest.createPayment({
      paymentMethod: PaymentMethod.Stripe,
      currency: 'USD',
    })

    if (response.payload.data.paymentUrl) {
      window.location.href = response.payload.data.paymentUrl
    }
  } else {
    // Existing Cash/VNPay logic
    // ...
  }
}
```

## Implementation Notes

**Key technical details to remember:**

### Core Features

#### Currency Handling

- **Stripe**: Always use USD, store amounts in cents internally
- **Conversion**: `amountUSD * 100 = amountInCents` (e.g., $10.50 → 1050 cents)
- **Storage**: Store original USD amount in database, not cents

#### Webhook Security

- **Always** verify `stripe-signature` header
- Use raw body (not JSON parsed) for signature verification
- Fastify: Enable `rawBody: true` in route config

#### Idempotency

- Use unique `transactionRef` (e.g., `PAY_<guestId>_<timestamp>`)
- Check if payment already processed before updating orders
- Stripe Checkout sessions expire after 24 hours (configurable)

### Patterns & Best Practices

#### Error Handling

```typescript
// Always wrap Stripe API calls in try-catch
try {
  const session = await stripe.checkout.sessions.create({...})
} catch (error: any) {
  console.error('Stripe API error:', error)
  throw new Error(`Payment failed: ${error.message}`)
}
```

#### Logging

```typescript
// Log all Stripe events for debugging
console.log('Stripe event received:', event.type, event.id)
console.log('Payment status:', payment.status, payment.transactionRef)
```

#### Async Operations

```typescript
// Use transactions for atomic operations
await prisma.$transaction(async (tx) => {
  await tx.payment.update({...})
  await tx.order.updateMany({...})
})
```

## Integration Points

**How do pieces connect?**

### Stripe API Integration

- **Base URL**: `https://api.stripe.com/v1/`
- **Authentication**: API key in Authorization header (handled by SDK)
- **API Version**: `2024-11-20.acacia` (latest stable)
- **Webhook Signature**: HMAC SHA256 signature in `stripe-signature` header

### Database Connections

- **Payment Table**: Store Stripe session ID in `externalSessionId` field
- **Order Table**: Update status to `Paid` after successful webhook
- **Socket Table**: Retrieve socket ID for real-time notifications

### Third-Party Service Setup

1. **Stripe Dashboard**: Configure webhooks
2. **Stripe CLI**: Test webhooks locally
3. **Socket.io**: Emit payment events to manager dashboard

## Error Handling

**How do we handle failures?**

### Stripe API Errors

```typescript
// Common errors
- 400: Bad request (invalid parameters)
- 401: Authentication failed (invalid API key)
- 402: Request failed (card declined)
- 429: Rate limit exceeded
- 500: Stripe server error

// Handling
if (error.type === 'StripeCardError') {
  // Card was declined
  return { error: 'Card was declined' }
} else if (error.type === 'StripeInvalidRequestError') {
  // Invalid parameters
  return { error: 'Invalid payment request' }
}
```

### Webhook Failures

- Stripe retries failed webhooks for up to 3 days
- Exponential backoff: 1h, 2h, 4h, etc.
- **Mitigation**: Implement idempotent handling (check if already processed)

### Network Errors

- **Client**: Show loading spinner, timeout after 30s
- **Server**: Retry Stripe API calls with exponential backoff
- **Webhook**: Return 200 OK to acknowledge receipt, process async

### Logging Approach

```typescript
// Use structured logging
console.error('[Stripe Error]', {
  type: error.type,
  message: error.message,
  transactionRef,
  timestamp: new Date().toISOString(),
})

// Consider integrating with Sentry (if configured)
Sentry.captureException(error, {
  tags: { payment_method: 'Stripe' },
  extra: { transactionRef, guestId },
})
```

## Performance Considerations

**How do we keep it fast?**

### Optimization Strategies

- **Async Processing**: Don't block webhook response, process async
- **Database Indexing**: `transactionRef` is indexed (unique constraint)
- **Stripe API**: Use `expand` parameter to reduce API calls
- **Caching**: Cache Stripe session for 5 minutes (optional)

### Caching Approach

- No caching needed (payments are one-time, not frequently accessed)
- Session lookup only happens on return URL (once per payment)

### Resource Management

- **Connection Pooling**: Prisma handles database connections
- **Stripe SDK**: Reuses HTTP connections automatically
- **Memory**: Webhook events are processed immediately, not queued

## Security Notes

**What security measures are in place?**

### Authentication/Authorization

- **Stripe Checkout**: No auth needed (public endpoint)
- **Return URL**: No auth (just displays result)
- **Webhook**: Verified via signature (no bearer token needed)
- **Payment Detail**: Requires guest/owner authentication

### Input Validation

```typescript
// Validate amount
if (totalAmountUSD <= 0) {
  throw new Error('Amount must be positive')
}

// Validate payment method
if (!PaymentMethodValues.includes(paymentMethod)) {
  throw new Error('Invalid payment method')
}

// Validate session ID
if (!session_id || !session_id.startsWith('cs_')) {
  throw new Error('Invalid session ID')
}
```

### Data Encryption

- **TLS/HTTPS**: Required for Stripe API and webhooks
- **API Keys**: Stored in environment variables (never hardcode)
- **Card Data**: Never touches our server (handled by Stripe Checkout)

### Secrets Management

```bash
# Use environment variables
STRIPE_SECRET_KEY=sk_test_xxx  # NEVER commit to git!
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Add to .gitignore
.env
.env.local
```

---

## Quick Start Checklist

- [ ] Install Stripe SDK (`npm install stripe`)
- [ ] Get test API keys from Stripe Dashboard
- [ ] Add environment variables to `.env`
- [ ] Install Stripe CLI (`brew install stripe/stripe-cli/stripe`)
- [ ] Forward webhooks (`stripe listen --forward-to localhost:4000/api/payments/stripe/webhook`)
- [ ] Copy webhook secret to `.env`
- [ ] Start server (`npm run dev`)
- [ ] Test payment with test card `4242 4242 4242 4242`

**Ready to implement? Start with Task 1.1 from the planning doc!**
