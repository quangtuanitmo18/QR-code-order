# YooKassa Common Issues & Solutions

## 🔗 Return URL Has No Query Parameters

### Problem
After completing payment, the return URL receives no `payment_id` or query parameters. Handler expects `payment_id` but it's not present.

### Root Cause
**Unlike Stripe, YooKassa does NOT automatically append query parameters to the return URL.**

| Payment Gateway | Return URL Behavior |
|----------------|---------------------|
| **Stripe** | Automatically adds `?session_id=xxx` |
| **YooKassa** | Returns URL exactly as provided (no auto params) |
| **VNPay** | Automatically adds payment verification params |

### Solution ✅
**Include the transaction reference in the return URL when creating the payment:**

```typescript
// ✅ Correct: Add txnRef to return URL
const returnUrlWithRef = `${envConfig.YOOKASSA_RETURN_URL}?txnRef=${transactionRef}`

const yookassaPayment = await createYooKassaPayment({
  amount: totalAmountRUB,
  transactionRef,
  description,
  returnUrl: returnUrlWithRef, // Include txnRef in URL
  guestEmail: undefined
})
```

**Return URL Handler:**

```typescript
// Extract txnRef from query params (that WE added)
const { txnRef } = request.query as { txnRef?: string }

if (!txnRef) {
  throw new Error('Transaction reference is required')
}

// Find payment in database using txnRef
const payment = await prisma.payment.findUnique({
  where: { transactionRef: txnRef }
})

// Fetch latest status from YooKassa API using payment ID
const yookassaPayment = await getYooKassaPayment(payment.externalTransactionId!)

// Check status
const paymentSuccess = yookassaPayment.status === 'succeeded'
```

---

## ❌ Error: "Не указано платежное поручение для передачи в ГИС ЖКХ"

### Problem
```
{
  "type": "error",
  "code": "invalid_request",
  "parameter": "payment_orders",
  "description": "Не указано платежное поручение для передачи в ГИС ЖКХ"
}
```

**Translation**: "Payment order for transmission to GIS ZhKKh (Housing and Communal Services Information System) is not specified"

### Root Cause
This error occurs when:
1. **Receipt (чек) is included** but incomplete
2. **GIS ZhKKh integration** is expected but not configured
3. **Payment orders** field is missing for utility payments

### Solution ✅
**Remove the receipt configuration for test accounts and simple payments.**

The fixed code in `server/src/utils/yookassa.ts`:

```typescript
const paymentConfig: any = {
  amount: {
    value: amount.toFixed(2),
    currency: 'RUB'
  },
  confirmation: {
    type: 'redirect',
    return_url: returnUrl
  },
  capture: true,
  description,
  metadata: {
    transactionRef,
    source: 'restaurant-order-system'
  }
  // ❌ Remove receipt for test mode
  // Receipt is optional and causes issues with test accounts
}
```

### When Receipt IS Required

Receipt (54-FZ compliance) is required for:
- **Production accounts** with fiscal obligations
- **Businesses registered in Russia**
- **Selling goods/services to Russian customers**

If you need receipt in production:

```typescript
const paymentConfig = {
  // ...basic config
  receipt: {
    customer: {
      email: 'customer@example.com',
      phone: '+79000000000' // Required for 54-FZ
    },
    items: [
      {
        description: 'Service name',
        quantity: '1.00',
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB'
        },
        vat_code: 1, // 1 = No VAT, 2 = 0%, 3 = 10%, 4 = 20%
        payment_mode: 'full_prepayment',
        payment_subject: 'service'
      }
    ],
    tax_system_code: 1 // 1 = OSN, 2 = USN income, 3 = USN income-expense, etc.
  }
}
```

---

## ❌ Error: "Invalid credentials" / 401 Unauthorized

### Problem
```
{
  "type": "error",
  "code": "invalid_credentials"
}
```

### Solution
1. Check `.env` file:
```bash
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=test_CybAGkAN3wSBD_uIirQ_3BqoC94xTgGAmmZHZiA0jIM
```

2. Verify credentials in YooKassa Dashboard:
   - Settings → API Settings
   - Copy Shop ID and Secret Key exactly

3. Test mode vs Production mode:
   - Test key starts with `test_`
   - Live key starts with `live_`

---

## ❌ Error: "Invalid return_url"

### Problem
```
{
  "parameter": "confirmation.return_url",
  "code": "invalid_value"
}
```

### Solution
1. Must be a **valid URL** with protocol:
```typescript
// ❌ Wrong
return_url: 'localhost:4000/payment/yookassa/return'

// ✅ Correct
return_url: 'http://localhost:4000/payment/yookassa/return'
```

2. For production, use **HTTPS**:
```typescript
return_url: 'https://yourdomain.com/payment/yookassa/return'
```

---

## ❌ Error: "Amount is too small"

### Problem
```
{
  "parameter": "amount.value",
  "code": "invalid_value",
  "description": "Сумма платежа меньше минимальной"
}
```

### Solution
Minimum amount is **1.00 RUB**:
```typescript
// ❌ Wrong
amount: { value: '0.50', currency: 'RUB' }

// ✅ Correct
amount: { value: '1.00', currency: 'RUB' }
```

---

## ❌ Webhook Not Receiving Notifications

### Problem
Webhook endpoint not called after payment.

### Solution
1. **Configure webhook URL** in YooKassa Dashboard:
   ```
   https://yourdomain.com/api/payments/yookassa/webhook
   ```

2. **Enable required events**:
   - payment.succeeded
   - payment.canceled
   - payment.waiting_for_capture

3. **Use ngrok for local testing**:
   ```bash
   ngrok http 4000
   # Use ngrok URL: https://xxxx.ngrok.io/api/payments/yookassa/webhook
   ```

4. **Check webhook logs** in YooKassa Dashboard

---

## ❌ Payment Status Not Updating

### Problem
Payment completed but order status still "Pending".

### Solution
1. **Webhook is the source of truth**, not return URL
2. Check webhook is properly configured
3. Verify `transactionRef` in metadata:
```typescript
metadata: {
  transactionRef: 'PAY_123_456789',
  source: 'restaurant-order-system'
}
```

4. Check server logs for webhook errors

---

## ⚠️ Test Mode Limitations

### What Works in Test Mode
✅ Create payments  
✅ Test card payments  
✅ Return URL redirects  
✅ Webhook notifications  

### What Doesn't Work in Test Mode
❌ Real money transactions  
❌ Some receipt configurations  
❌ GIS ZhKKh integration  
❌ Some payment methods (Yandex.Money, QIWI in test)  

### Test Cards
```
Success: 5555 5555 5555 4444
Failed:  5555 5555 5555 5599
3DS:     5555 5555 5555 4477
```

---

## 🔍 Debugging Tips

### Enable Detailed Logging
```typescript
// In yookassa.ts
console.log('Creating YooKassa payment:', {
  amount: paymentConfig.amount,
  transactionRef,
  returnUrl
})

// Log API errors
if (error.response?.data) {
  console.error('YooKassa API Error:', JSON.stringify(error.response.data, null, 2))
}
```

### Check YooKassa Dashboard
1. Go to **Payments** section
2. View payment details
3. Check **Webhook logs**
4. Review **API request logs**

### Test Webhook Locally
```bash
# Use ngrok
ngrok http 4000

# Update webhook URL in YooKassa Dashboard
https://xxxx.ngrok.io/api/payments/yookassa/webhook

# Make a test payment and check logs
```

---

## 📚 References

- [YooKassa API Docs](https://yookassa.ru/developers/api)
- [54-FZ Receipts Guide](https://yookassa.ru/developers/54fz/parameters-values)
- [Testing Guide](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing)
- [Webhook Events](https://yookassa.ru/developers/using-api/webhooks)

---

## 🆘 Still Having Issues?

1. Check [YooKassa Status Page](https://status.yookassa.ru/)
2. Review server logs: `npm run dev` output
3. Check YooKassa Dashboard → Webhooks → Logs
4. Contact [YooKassa Support](https://yookassa.ru/support)
5. Review this project's documentation:
   - `/docs/YOOKASSA_SETUP_GUIDE.md`
   - `/docs/YOOKASSA_QUICK_START.md`
