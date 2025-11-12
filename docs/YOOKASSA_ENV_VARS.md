# YooKassa Environment Variables

## Add these to your server/.env file:

```bash
# YooKassa Payment Gateway Configuration
# Get these from: https://yookassa.ru/my/shop/settings

# Shop ID (найден в настройках магазина)
YOOKASSA_SHOP_ID=your_shop_id_here

# Secret Key (секретный ключ)
YOOKASSA_SECRET_KEY=your_secret_key_here

# Return URL - where YooKassa redirects users after payment
# Development:
YOOKASSA_RETURN_URL=http://localhost:4000/api/payments/yookassa/return

# Production:
# YOOKASSA_RETURN_URL=https://your-domain.com/api/payments/yookassa/return
```

## Testing Values

For test mode, YooKassa will provide test credentials in your dashboard when you enable test mode.

## Webhook Configuration

Configure webhook in YooKassa dashboard to:
```
Development (using ngrok): https://your-ngrok-url.ngrok.io/api/payments/yookassa/webhook
Production: https://your-domain.com/api/payments/yookassa/webhook
```

Select these webhook events:
- payment.succeeded
- payment.canceled  
- payment.waiting_for_capture
