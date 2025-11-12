# YooKassa Return URL Fix

## 🐛 Problem

After completing payment on YooKassa, the return URL handler received no query parameters, causing the error:
```
Payment ID is required
```

## 🔍 Root Cause

**YooKassa does NOT automatically append query parameters to the return URL when redirecting users back to your site.**

This is fundamentally different from other payment gateways:

| Payment Gateway | Redirect Behavior | Example |
|----------------|-------------------|---------|
| **Stripe** | ✅ Auto-adds `session_id` | `return_url?session_id=cs_xxx` |
| **VNPay** | ✅ Auto-adds all params | `return_url?vnp_TxnRef=xxx&vnp_ResponseCode=00&...` |
| **YooKassa** | ❌ Returns URL exactly as provided | `return_url` (no params added!) |

## ✅ Solution

**Include the transaction reference in the return URL when creating the payment.**

### Changes Made

#### 1. **Payment Creation** (`/server/src/controllers/payment.controller.ts`)

```typescript
// ❌ Before: Return URL had no params
const yookassaPayment = await createYooKassaPayment({
  amount: totalAmountRUB,
  transactionRef,
  description,
  returnUrl: envConfig.YOOKASSA_RETURN_URL, // ❌ No params
  guestEmail: undefined
})

// ✅ After: Include transaction reference in URL
const returnUrlWithRef = `${envConfig.YOOKASSA_RETURN_URL}?txnRef=${transactionRef}`

const yookassaPayment = await createYooKassaPayment({
  amount: totalAmountRUB,
  transactionRef,
  description,
  returnUrl: returnUrlWithRef, // ✅ Includes txnRef
  guestEmail: undefined
})
```

#### 2. **Return URL Handler** (`/server/src/routes/payment.route.ts`)

```typescript
// ❌ Before: Expected payment_id (which YooKassa doesn't send)
fastify.get('/yookassa/return', async (request, reply) => {
  const { payment_id } = request.query // ❌ Undefined!
  
  if (!payment_id) {
    throw new Error('Payment ID is required') // ❌ Always throws
  }
  
  const yookassaPayment = await getYooKassaPayment(payment_id)
  // ...
})

// ✅ After: Extract txnRef (which we added)
fastify.get('/yookassa/return', async (request, reply) => {
  const { txnRef } = request.query // ✅ We added this!
  
  if (!txnRef) {
    throw new Error('Transaction reference is required')
  }
  
  // Find payment in database
  const payment = await prisma.payment.findUnique({
    where: { transactionRef: txnRef }
  })
  
  // Fetch latest status from YooKassa API
  const yookassaPayment = await getYooKassaPayment(payment.externalTransactionId!)
  
  // Check if payment succeeded
  const paymentSuccess = yookassaPayment.status === 'succeeded'
  
  // Redirect to result page
  const redirectUrl = `${clientUrl}/guest/orders/payment-result?success=${paymentSuccess}&amount=${payment.amount}&txnRef=${txnRef}&method=YooKassa`
  
  reply.redirect(redirectUrl)
})
```

## 🎯 Key Takeaways

### 1. **YooKassa Design Philosophy**
- **return_url**: For user experience only (redirect user back to site)
- **webhook**: For actual payment status updates (reliable, server-to-server)

### 2. **Best Practice**
Always include necessary identifiers in the return URL:
```typescript
const returnUrl = `${baseUrl}?txnRef=${transactionRef}&orderId=${orderId}`
```

### 3. **Don't Rely on Return URL for Critical Logic**
- ✅ Use webhook for payment confirmation
- ✅ Use return URL for user experience (showing result page)
- ❌ Don't use return URL as primary payment verification method

## 🔄 Complete Flow

```
1. User clicks "Pay with YooKassa"
   ↓
2. Backend creates payment with return_url?txnRef=xxx
   ↓
3. User redirected to YooKassa payment page
   ↓
4. User completes payment
   ↓
5. YooKassa redirects to: return_url?txnRef=xxx
   (txnRef is preserved because WE added it)
   ↓
6. Return handler:
   - Extract txnRef from query
   - Find payment in database
   - Fetch latest status from YooKassa API
   - Redirect to result page
   ↓
7. Webhook arrives (async):
   - Update payment status
   - Update order status
   - Emit Socket.io event
```

## 📝 Files Modified

1. `/server/src/controllers/payment.controller.ts`
   - Added `returnUrlWithRef` with `txnRef` parameter

2. `/server/src/routes/payment.route.ts`
   - Updated return handler to use `txnRef` instead of `payment_id`
   - Added status check via YooKassa API

3. `/docs/YOOKASSA_TROUBLESHOOTING.md`
   - Added section about return URL parameters

4. `/docs/ai/implementation/yookassa-integration-summary.md`
   - Updated comparison table
   - Added warning about return URL behavior

## ✅ Result

- ✅ Return URL now receives transaction reference
- ✅ Handler can find payment in database
- ✅ Handler fetches latest status from YooKassa
- ✅ User sees correct payment result
- ✅ Webhook still handles async status updates

## 🧪 Testing

```bash
# 1. Create payment
POST /api/payments

# 2. Complete payment on YooKassa

# 3. Verify return URL has txnRef
GET /api/payments/yookassa/return?txnRef=TXN-1234567890

# Expected logs:
✅ YooKassa return: Query params: {"txnRef":"TXN-1234567890"}
✅ YooKassa return: Payment status from API: succeeded
✅ YooKassa return: Redirecting to /guest/orders/payment-result?success=true&...

# 4. Verify webhook
POST /api/payments/yookassa/webhook
(Authorization: Basic <credentials>)

# Expected logs:
✅ YooKassa webhook notification: payment.succeeded
✅ YooKassa payment processed: Emitted to Socket.io
```

## 🔗 Related Documentation

- [YooKassa Setup Guide](/docs/YOOKASSA_SETUP_GUIDE.md)
- [YooKassa Troubleshooting](/docs/YOOKASSA_TROUBLESHOOTING.md)
- [YooKassa Integration Summary](/docs/ai/implementation/yookassa-integration-summary.md)
- [Official YooKassa Docs](https://yookassa.ru/developers/payment-acceptance/overview)
