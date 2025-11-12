# YooKassa GIS ZhKKh Payment Orders Issue - SOLUTION

## ❌ Problem
```json
{
  "type": "error",
  "code": "invalid_request",
  "parameter": "payment_orders",
  "description": "Не указано платежное поручение для передачи в ГИС ЖКХ"
}
```

**Translation**: "Payment order for transmission to GIS ZhKKh (Housing and Communal Services Information System) is not specified"

---

## 🔍 Root Cause

Your YooKassa test shop has **"Accept utility payments"** (Принимаю платежи за ЖКУ) option **ENABLED** in settings.

This makes `payment_orders` with full GIS ZhKKh structure **MANDATORY** for all payments.

---

## ✅ Solution 1: Disable Utility Payments (RECOMMENDED for Testing)

### Steps:
1. Go to [YooKassa Dashboard](https://yookassa.ru/my/)
2. Select your **test shop**
3. Navigate to: **Настройки → Магазин → Настройка платежей** (Settings → Shop → Payment Settings)
4. **DISABLE** the toggle: **"Принимаю платежи за жилищно-коммунальные услуги"** (Accept utility payments)
5. Save changes

### After disabling:
Your current code will work without `payment_orders`:

```typescript
const paymentConfig = {
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
  // No payment_orders needed ✅
}
```

---

## ✅ Solution 2: Implement Full GIS ZhKKh Payment Orders

If you MUST keep utility payments enabled, implement proper `payment_orders`:

### Update `server/src/utils/yookassa.ts`:

```typescript
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
      },
      // Full GIS ZhKKh payment_orders structure
      payment_orders: [
        {
          // Purpose of payment (назначение платежа)
          purpose: description,
          // Amount for this payment order
          amount: {
            value: amount.toFixed(2),
            currency: 'RUB'
          },
          // Recipient information (получатель)
          recipient: {
            // Organization name (наименование организации)
            name: 'Restaurant Order System',
            // TIN (ИНН) - Tax Identification Number
            // Use test value or your actual INN
            inn: '1234567890',
            // KPP (КПП) - Tax Registration Reason Code (optional)
            // kpp: '123456789'
          },
          // Payer information (плательщик) - optional but recommended
          payer: {
            name: guestEmail || 'Guest User'
          }
        }
      ]
    }

    console.log('Creating YooKassa payment with GIS ZhKKh:', {
      amount: paymentConfig.amount,
      transactionRef,
      payment_orders: paymentConfig.payment_orders
    })

    const payment = await yookassa.createPayment(paymentConfig)

    console.log('YooKassa payment created successfully:', {
      id: payment.id,
      status: payment.status
    })

    return payment
  } catch (error: any) {
    console.error('YooKassa payment creation failed:', error)
    
    if (error.response?.data) {
      console.error('YooKassa API Error:', JSON.stringify(error.response.data, null, 2))
    }
    
    throw new Error(`Failed to create YooKassa payment: ${error.message}`)
  }
}
```

### Required Fields for GIS ZhKKh:

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| `purpose` | Payment purpose | ✅ Yes | "Restaurant order payment" |
| `amount.value` | Amount in RUB | ✅ Yes | "1000.00" |
| `amount.currency` | Currency | ✅ Yes | "RUB" |
| `recipient.name` | Organization name | ✅ Yes | "Restaurant Name LLC" |
| `recipient.inn` | Tax ID (ИНН) | ✅ Yes | "1234567890" |
| `recipient.kpp` | Tax code (КПП) | ⚪ Optional | "123456789" |
| `payer.name` | Payer name | ⚪ Optional | "John Doe" |

---

## 📝 Which Solution to Choose?

### Use Solution 1 (Disable Utility Payments) if:
- ✅ You're running a **restaurant/e-commerce** business
- ✅ You're **testing** the integration
- ✅ You don't need GIS ZhKKh compliance
- ✅ You want **simpler** integration

### Use Solution 2 (Full GIS ZhKKh) if:
- ✅ You're accepting **utility payments** (electricity, water, gas)
- ✅ You **must** comply with GIS ZhKKh regulations
- ✅ Your business is registered for utility services
- ✅ You have valid **INN** and **KPP** numbers

---

## 🧪 Testing After Fix

### After Solution 1 (Recommended):
```bash
# 1. Disable utility payments in YooKassa Dashboard
# 2. Test payment creation
npm run dev

# 3. Create order and pay
# Should work without payment_orders ✅
```

### After Solution 2:
```bash
# 1. Update code with full payment_orders structure
# 2. Test payment creation
npm run dev

# 3. Create order and pay
# Should work with GIS ZhKKh compliance ✅
```

---

## 📚 References

- [YooKassa Utility Payments Docs](https://yookassa.ru/developers/payment-acceptance/scenario-extensions/utility-payments)
- [Testing Guide](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing?lang=ru)
- [GIS ZhKKh Integration](https://dom.gosuslugi.ru/)

---

## 🎯 Recommendation

**For Restaurant/E-Commerce:** Use **Solution 1** (Disable utility payments)

Your business is a **restaurant ordering system**, NOT a utility payment provider. You should:
1. Disable "Accept utility payments" in YooKassa settings
2. Use simple payment structure without `payment_orders`
3. Keep the code clean and maintainable

**Payment_orders is ONLY for:**
- Electricity bills (электричество)
- Water bills (водоснабжение)  
- Gas bills (газоснабжение)
- Heating bills (отопление)
- Other utility services

**NOT for:**
- Restaurant orders 🍕
- E-commerce 🛒
- Services 💼
- Entertainment 🎮

---

## ✅ Quick Fix

1. Go to https://yookassa.ru/my/shop-settings
2. Find "Принимаю платежи за ЖКУ"
3. **Turn it OFF** ❌
4. Save
5. Test again - should work! ✅

---

**This is a configuration issue, not a code issue!** 🎉
