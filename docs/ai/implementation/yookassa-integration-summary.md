# YooKassa Integration - Implementation Summary

## ✅ Implementation Complete!

This document summarizes the YooKassa payment integration that was added to your QR Code Order system.

---

## 📦 What Was Added

### 1. **New Package Installed**
```bash
@appigram/yookassa-node@latest
```

### 2. **New Files Created**

#### `/server/src/utils/yookassa.ts`
Core YooKassa utility functions:
- `createYooKassaPayment()` - Create a new payment
- `getYooKassaPayment()` - Retrieve payment status
- `verifyYooKassaWebhook()` - Verify webhook notifications
- `getYooKassaPaymentStatus()` - Extract payment status

#### `/server/src/types/yookassa.d.ts`
TypeScript type definitions for YooKassa SDK

#### `/docs/YOOKASSA_SETUP_GUIDE.md`
Complete setup and integration guide (350+ lines)

#### `/docs/YOOKASSA_ENV_VARS.md`
Environment variables reference

### 3. **Modified Files**

#### `/server/src/config.ts`
Added YooKassa environment variables:
```typescript
YOOKASSA_SHOP_ID: z.string()
YOOKASSA_SECRET_KEY: z.string()
YOOKASSA_RETURN_URL: z.string().url()
```

#### `/server/src/utils/currency.ts`
Added RUB currency conversion:
```typescript
convertUSDtoRUB(usdAmount: number): Promise<number>
getLiveExchangeRate('RUB')
```

#### `/server/src/constants/type.ts`
Added YooKassa payment method:
```typescript
PaymentMethod.YooKassa = 'YooKassa'
```

#### `/server/src/controllers/payment.controller.ts`
Added YooKassa payment processing:
- `processYooKassaPayment()` - Create payment with USD→RUB conversion
- `verifyYooKassaPaymentController()` - Process webhook notifications

#### `/server/src/routes/payment.route.ts`
Added two new routes:
- `GET /yookassa/return` - Return URL after payment
- `POST /yookassa/webhook` - Webhook notification handler

---

## 🔄 How It Works

### Payment Creation Flow

```
1. Guest creates order ($10.50 USD)
   ↓
2. System converts to RUB (95.5 rate → 1,002.75 RUB)
   ↓
3. Create YooKassa payment (1,002.75 RUB)
   ↓
4. Redirect guest to YooKassa payment page
   ↓
5. Guest completes payment
   ↓
6. YooKassa redirects to /yookassa/return
   ↓
7. Show payment result to user
   ↓
8. YooKassa sends webhook to /yookassa/webhook (async)
   ↓
9. Update order status in database
   ↓
10. Emit Socket.io event to update UI
```

### Currency Conversion

```typescript
// Example: $10.50 USD
const usdAmount = 10.50

// Fetch live rate
const exchangeRate = await getLiveExchangeRate('RUB') // 95.5

// Convert
const rubAmount = await convertUSDtoRUB(usdAmount) // 1,002.75 RUB

// Store both in payment record
{
  amount: 10.50,           // Original (USD)
  currency: 'USD',
  metadata: {
    convertedAmount: 1002.75,
    convertedCurrency: 'RUB',
    exchangeRate: 95.5
  }
}
```

---

## 🔧 Required Configuration

### Environment Variables (.env)
```bash
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_RETURN_URL=http://localhost:4000/api/payments/yookassa/return
```

### YooKassa Dashboard Settings
1. **Webhook URL**: `https://your-domain.com/api/payments/yookassa/webhook`
2. **Webhook Events**:
   - ✅ payment.succeeded
   - ✅ payment.canceled
   - ✅ payment.waiting_for_capture
3. **Authentication**: Basic Auth (automatic)

---

## 🧪 Testing

### Test Card Numbers
```
Success: 5555 5555 5555 4444
Failed:  5555 5555 5555 5599
3DS:     5555 5555 5555 4477
```

### Test Flow
```bash
# 1. Start server
cd server && npm run dev

# 2. In frontend:
- Select YooKassa payment method
- Complete order
- Pay with test card
- Verify redirect back to app

# 3. Check logs:
✅ YooKassa payment created
✅ YooKassa webhook received
✅ Orders updated to Paid status
✅ Socket.io event emitted
```

---

## 🆚 Comparison with Other Gateways

| Feature | YooKassa | VNPay | Stripe |
|---------|----------|-------|--------|
| **Currency** | RUB only | VND only | 135+ |
| **Conversion** | USD→RUB | USD→VND | Not needed |
| **Exchange Rate** | Live API | Live API | N/A |
| **Webhook Auth** | Basic Auth | HMAC | Secret |
| **Return URL** | Yes | Yes | Yes |
| **Return URL Params** | ❌ None (manual) | ✅ Auto | ✅ Auto |
| **Test Mode** | Yes | Yes | Yes |

### ⚠️ Important: Return URL Behavior

**YooKassa does NOT automatically add query parameters to return URLs!**

This is different from Stripe and VNPay:

| Gateway | Return URL Behavior |
|---------|---------------------|
| **Stripe** | Automatically adds `?session_id=cs_xxx` |
| **VNPay** | Automatically adds `?vnp_TxnRef=xxx&vnp_ResponseCode=00&...` |
| **YooKassa** | Returns URL **exactly as provided** (no params added) |

**Solution:** Include transaction reference in the return URL when creating payment:

```typescript
// ✅ YooKassa: Must include params manually
const returnUrlWithRef = `${YOOKASSA_RETURN_URL}?txnRef=${transactionRef}`
createYooKassaPayment({ returnUrl: returnUrlWithRef })

// ✅ Stripe: Session ID added automatically
createStripeSession({ success_url: STRIPE_RETURN_URL })
// Stripe redirects to: STRIPE_RETURN_URL?session_id=cs_xxx

// ✅ VNPay: All params added automatically  
buildVNPayUrl({ returnUrl: VNPAY_RETURN_URL })
// VNPay redirects to: VNPAY_RETURN_URL?vnp_TxnRef=xxx&vnp_ResponseCode=00&...
```

### Code Pattern (All 3 Gateways)
```typescript
// 1. Create payment
if (method === 'VNPay') {
  const amountVND = await convertUSDtoVND(totalUSD)
  await buildVNPayPaymentUrl({ amount: amountVND, ... })
}
if (method === 'Stripe') {
  const amountCents = totalUSD * 100
  await createStripeCheckoutSession({ amount: amountCents, ... })
}
if (method === 'YooKassa') {
  const amountRUB = await convertUSDtoRUB(totalUSD)
  // ⚠️ Add txnRef to return URL
  const returnUrl = `${YOOKASSA_RETURN_URL}?txnRef=${transactionRef}`
  await createYooKassaPayment({ amount: amountRUB, returnUrl, ... })
}

// 2. Return URL Handlers
// VNPay: Extract auto-added params
GET /vnpay/return?vnp_TxnRef=xxx&vnp_ResponseCode=00&...

// Stripe: Extract auto-added session_id
GET /stripe/return?session_id=cs_xxx

// YooKassa: Extract manually-added txnRef
GET /yookassa/return?txnRef=xxx
```

---

## 📁 File Structure

```
server/
├── src/
│   ├── config.ts                          ← Added YooKassa env vars
│   ├── constants/
│   │   └── type.ts                        ← Added PaymentMethod.YooKassa
│   ├── controllers/
│   │   └── payment.controller.ts          ← Added YooKassa functions
│   ├── routes/
│   │   └── payment.route.ts               ← Added YooKassa routes
│   ├── types/
│   │   └── yookassa.d.ts                  ← NEW: Type definitions
│   └── utils/
│       ├── currency.ts                     ← Added convertUSDtoRUB()
│       └── yookassa.ts                     ← NEW: YooKassa utils
├── package.json                            ← Added @appigram/yookassa-node
└── .env                                    ← Add YOOKASSA_* variables

docs/
├── YOOKASSA_SETUP_GUIDE.md                 ← NEW: Complete guide
└── YOOKASSA_ENV_VARS.md                    ← NEW: Env vars reference
```

---

## 🔒 Security Features

### Webhook Verification
```typescript
// YooKassa sends: Authorization: Basic base64(shopId:secretKey)
// We verify:
const [shopId, secretKey] = decodeBasicAuth(header)
if (shopId !== YOOKASSA_SHOP_ID || secretKey !== YOOKASSA_SECRET_KEY) {
  throw new Error('Invalid credentials')
}
```

### Metadata Tracking
```typescript
{
  transactionRef: 'unique-ref',          // Link payment to order
  originalAmount: 10.50,                 // USD amount
  convertedAmount: 1002.75,              // RUB amount
  exchangeRate: 95.5,                    // Rate used
  yookassaPaymentId: 'yookassa-id'       // External payment ID
}
```

---

## 🚀 Deployment Checklist

- [ ] Install package: `npm install @appigram/yookassa-node`
- [ ] Add environment variables to `.env`
- [ ] Update `YOOKASSA_RETURN_URL` for production
- [ ] Configure webhook in YooKassa dashboard
- [ ] Test with test cards
- [ ] Verify webhook receives notifications
- [ ] Test currency conversion
- [ ] Complete YooKassa business verification
- [ ] Switch from test mode to live mode
- [ ] Monitor logs in production

---

## 📊 Database Schema Impact

### Payment Table
```typescript
{
  paymentMethod: 'YooKassa',           // New enum value
  currency: 'USD',                      // Always stored in USD
  amount: 10.50,                        // USD amount
  externalTransactionId: 'yookassa-id', // YooKassa payment ID
  metadata: JSON.stringify({
    convertedAmount: 1002.75,           // RUB amount
    convertedCurrency: 'RUB',
    exchangeRate: 95.5
  })
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Module '@appigram/yookassa-node' not found"
**Solution**: Run `npm install` in server directory

### Issue: "Webhook not received"
**Solution**: 
1. Use ngrok for local development
2. Configure webhook URL in YooKassa dashboard
3. Check Basic Auth credentials

### Issue: "Currency conversion fails"
**Solution**: 
- Falls back to default rate (95 RUB/USD)
- Check internet connection for API access

### Issue: "Payment status not updating"
**Solution**: 
- Webhook is source of truth, not return URL
- Check webhook logs in YooKassa dashboard
- Verify `transactionRef` in metadata

---

## 📚 Documentation Links

- **Setup Guide**: `/docs/YOOKASSA_SETUP_GUIDE.md`
- **Environment Variables**: `/docs/YOOKASSA_ENV_VARS.md`
- **YooKassa API Docs**: https://yookassa.ru/developers/api
- **YooKassa SDK**: https://www.npmjs.com/package/@appigram/yookassa-node

---

## ✨ Features Implemented

✅ Payment creation with USD→RUB conversion  
✅ Live exchange rate fetching  
✅ Return URL handling  
✅ Webhook notification processing  
✅ Real-time Socket.io updates  
✅ Error handling and logging  
✅ Test mode support  
✅ Type safety with TypeScript  
✅ Metadata tracking  
✅ Payment status synchronization  

---

## 🎯 Next Steps

1. **Configure YooKassa account** (if not done)
2. **Add environment variables** to `.env`
3. **Test with test cards**
4. **Configure webhook** in dashboard
5. **Update frontend** to show YooKassa option
6. **Deploy to production**

---

## 💡 Tips

- Always test webhooks with ngrok during development
- Monitor YooKassa dashboard logs for debugging
- Use test mode until business verification is complete
- Keep `secretKey` secure (never commit to git)
- RUB amounts use 2 decimal places (e.g., 1002.75)
- Webhook is more reliable than return URL

---

**Implementation Date**: November 12, 2025  
**Status**: ✅ Complete and Ready for Testing  
**Integration Pattern**: Follows VNPay and Stripe patterns  

For questions or issues, refer to the detailed setup guide or YooKassa documentation.
