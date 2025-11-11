# Stripe Payment Integration - Setup Guide

**Feature**: Stripe Checkout payment integration for restaurant orders  
**Status**: ✅ Implementation Complete (Test Mode)  
**Date**: November 11, 2024

---

## 📋 Overview

This guide walks you through setting up and testing the Stripe payment integration. The implementation allows guests to pay for their restaurant orders using credit/debit cards through Stripe Checkout.

### What's Been Implemented

- ✅ **Backend**: Stripe SDK, payment processing, webhook handling
- ✅ **Frontend**: Payment method selector, redirect flow, result page
- ✅ **Features**: Real-time Socket.io notifications, payment history
- ✅ **Mode**: Test/Sandbox only (no production deployment)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Get Stripe Test API Keys

1. **Sign up for Stripe** (free): https://dashboard.stripe.com/register
2. Navigate to: **Developers → API keys**
3. Toggle to **"Test mode"** (top right)
4. Copy your **Secret key** (starts with `sk_test_`)

### Step 2: Configure Environment Variables

Edit `server/.env`:

```env
# Replace these placeholder values with your real test keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx  # Get from Step 3
STRIPE_RETURN_URL=http://localhost:4000/api/payments/stripe/return
```

### Step 3: Install Stripe CLI

**macOS:**

```bash
brew install stripe/stripe-cli/stripe
```

**Windows (with Scoop):**

```bash
scoop install stripe
```

**Linux / Manual:**
Download from: https://github.com/stripe/stripe-cli/releases

**Login to Stripe:**

```bash
stripe login
```

**Forward webhooks to local server:**

```bash
stripe listen --forward-to localhost:4000/api/payments/stripe/webhook
```

**Copy the webhook signing secret** (whsec_xxx) shown in the CLI output and add it to `server/.env`

### Step 4: Start Development Servers

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

**Terminal 3 - Stripe Webhooks:**

```bash
stripe listen --forward-to localhost:4000/api/payments/stripe/webhook
```

### Step 5: Test Payment Flow

1. Open http://localhost:3000
2. Login as guest (create account if needed)
3. Add items to cart
4. Navigate to `/guest/orders`
5. Select **"Stripe (Credit/Debit Card - USD)"**
6. Click **"Pay Now"**
7. You'll be redirected to Stripe Checkout
8. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
9. Complete payment
10. Verify you're redirected back with success message
11. Check that orders are marked as **"Paid"**

---

## 💳 Test Card Numbers

### Successful Payments

```
4242 4242 4242 4242  (Visa - always succeeds)
5555 5555 5555 4444  (Mastercard - always succeeds)
3782 822463 10005    (American Express - always succeeds)
```

### Declined Payments

```
4000 0000 0000 0002  (Generic decline)
4000 0000 0000 9995  (Insufficient funds)
4000 0000 0000 9987  (Lost card)
4000 0000 0000 0069  (Expired card)
```

### Special Test Cases

```
4000 0082 6000 0000  (3D Secure authentication required)
4000 0000 0000 3220  (3D Secure 2 authentication must fail)
```

**For all test cards:**

- Expiry: Any future date
- CVC: Any 3 digits (or 4 for Amex)
- ZIP: Any 5 digits

---

## 🔧 Technical Architecture

### Payment Flow

```
1. Guest selects Stripe payment method
2. Frontend sends POST /api/guest/orders/create-payment
3. Backend creates Stripe Checkout Session
4. Backend saves Payment record (status: "Pending")
5. Frontend redirects to Stripe Checkout URL
6. Guest enters card details on Stripe's page
7. Stripe processes payment
8. Stripe sends webhook to server (payment_intent.succeeded)
9. Backend verifies webhook signature
10. Backend updates Payment (status: "Success")
11. Backend updates Orders (status: "Paid")
12. Backend emits Socket.io event to manager dashboard
13. Stripe redirects guest back to app
14. Guest sees success page
```

### Files Modified

**Server (Backend):**

- `src/config.ts` - Added Stripe environment variables
- `src/utils/stripe.ts` - **NEW** - Stripe utility functions
- `src/constants/type.ts` - Added Stripe to PaymentMethod enum
- `src/controllers/payment.controller.ts` - Added Stripe payment processing
- `src/routes/payment.route.ts` - Added Stripe return & webhook endpoints
- `.env` - Added Stripe configuration

**Client (Frontend):**

- `src/constants/type.ts` - Added Stripe to PaymentMethod enum
- `src/app/[locale]/guest/orders/orders-cart.tsx` - Added Stripe UI option

### API Endpoints

**Public Endpoints (No Auth):**

- `GET /api/payments/stripe/return` - Guest return from Stripe Checkout
- `POST /api/payments/stripe/webhook` - Stripe webhook (IPN)

**Authenticated Endpoints:**

- `POST /api/guest/orders/create-payment` - Create payment (existing, now supports Stripe)

### Database Schema

The existing `Payment` table already supports Stripe:

```prisma
model Payment {
  id                    Int       @id
  guestId               Int?
  amount                Int       // USD amount
  currency              String?   // "USD"
  paymentMethod         String    // "Stripe"
  status                String    // "Pending" | "Success" | "Failed"
  transactionRef        String    @unique
  externalSessionId     String?   // Stripe session ID (cs_xxx)
  externalTransactionId String?   // Stripe payment intent ID (pi_xxx)
  paymentIntentStatus   String?   // "succeeded"
  last4Digits           String?   // Last 4 digits of card
  cardBrand             String?   // "visa" | "mastercard" | "amex"
  paymentUrl            String?   // Stripe Checkout URL
  returnUrl             String?   // Our return URL
  metadata              String?   // JSON metadata
  paidAt                DateTime?
  // ... other fields
}
```

---

## 🧪 Testing Checklist

### ✅ Happy Path

- [ ] Guest can select Stripe payment method
- [ ] Redirects to Stripe Checkout page
- [ ] Payment with test card succeeds
- [ ] Redirects back to app with success message
- [ ] Orders marked as "Paid" in database
- [ ] Manager dashboard updates in real-time (Socket.io)
- [ ] Payment appears in payment history

### ❌ Failure Cases

- [ ] Declined card shows error
- [ ] Guest cancels checkout (clicks back)
- [ ] Payment fails gracefully
- [ ] Orders remain "Pending"
- [ ] Guest can retry payment

### 🔐 Security

- [ ] Webhook signature verified
- [ ] Invalid signatures rejected (400 error)
- [ ] No sensitive card data stored in database
- [ ] HTTPS used for all Stripe communication

### ⚡ Real-time Features

- [ ] Manager receives Socket.io notification on payment success
- [ ] Guest sees order status update without refresh
- [ ] Payment history updates immediately

### 🐛 Edge Cases

- [ ] Double payment prevention (idempotency)
- [ ] Webhook retry handling (Stripe retries for 3 days)
- [ ] Session expiration (30 minutes)
- [ ] Network failure during payment
- [ ] Empty cart (no orders to pay)

---

## 🔍 Troubleshooting

### Issue: "Webhook signature verification failed"

**Cause**: Webhook secret mismatch  
**Solution**:

1. Stop Stripe CLI
2. Run `stripe listen --forward-to localhost:4000/api/payments/stripe/webhook`
3. Copy the new `whsec_` secret
4. Update `server/.env`
5. Restart backend server

### Issue: "Invalid API key"

**Cause**: Wrong Stripe key or not in test mode  
**Solution**:

1. Check Stripe Dashboard is in **Test mode** (toggle top-right)
2. Copy the **Secret key** (not Publishable key)
3. Ensure it starts with `sk_test_`
4. Update `server/.env`
5. Restart backend server

### Issue: Webhook not firing

**Cause**: Stripe CLI not running or wrong URL  
**Solution**:

1. Ensure Stripe CLI is running: `stripe listen --forward-to localhost:4000/api/payments/stripe/webhook`
2. Check webhook secret in `.env` matches CLI output
3. Verify backend is running on port 4000
4. Check terminal for webhook events

### Issue: Payment succeeds but orders not updated

**Cause**: Webhook processing error  
**Solution**:

1. Check backend logs for errors
2. Verify database connection
3. Check Socket.io connection
4. Look for errors in Stripe CLI output

### Issue: Redirect fails after payment

**Cause**: Incorrect return URL  
**Solution**:

1. Verify `STRIPE_RETURN_URL` in `.env` is correct
2. Ensure frontend is running on expected port
3. Check browser console for redirect errors

---

## 📊 Monitoring

### Stripe Dashboard

- View all test payments: https://dashboard.stripe.com/test/payments
- View webhooks: https://dashboard.stripe.com/test/webhooks
- View logs: https://dashboard.stripe.com/test/logs

### Application Logs

**Backend:**

```bash
# Terminal running backend will show:
- "Stripe payment created: [id] [transactionRef]"
- "Stripe webhook event: [type] [id]"
- "Stripe payment processed: Emitted to Socket.io"
```

**Stripe CLI:**

```bash
# Terminal running Stripe CLI will show:
- "[webhook] → POST http://localhost:4000/api/payments/stripe/webhook [200 OK]"
- Event types: checkout.session.completed, payment_intent.succeeded
```

---

## 🎯 Next Steps

### Before Testing

1. [ ] Get Stripe test API keys
2. [ ] Configure environment variables
3. [ ] Install Stripe CLI
4. [ ] Start all 3 servers (backend, frontend, Stripe CLI)

### Testing Phase

1. [ ] Run through happy path test
2. [ ] Test failure scenarios
3. [ ] Verify webhook processing
4. [ ] Check real-time updates
5. [ ] Test edge cases

### Before Production (Future)

- [ ] Get real Stripe API keys (requires business verification)
- [ ] Set up production webhook endpoint (HTTPS required)
- [ ] Configure webhook in Stripe Dashboard
- [ ] Test with small real payment
- [ ] Enable production mode

---

## 📚 Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Checkout Guide**: https://stripe.com/docs/payments/checkout
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Test Cards**: https://stripe.com/docs/testing
- **Stripe Node.js SDK**: https://github.com/stripe/stripe-node

---

## 🆘 Support

**Implementation Issues:**

- Check implementation guide: `docs/ai/implementation/feature-stripe-payment-integration.md`
- Review design decisions: `docs/ai/design/feature-stripe-payment-integration.md`

**Stripe Issues:**

- Stripe Support: https://support.stripe.com
- Stripe Discord: https://discord.gg/stripe

**Testing Issues:**

- Review test cases: `docs/ai/testing/feature-stripe-payment-integration.md`

---

**Last Updated**: November 11, 2024  
**Implementation Status**: ✅ Complete (Test Mode Only)  
**Estimated Setup Time**: 30 minutes
