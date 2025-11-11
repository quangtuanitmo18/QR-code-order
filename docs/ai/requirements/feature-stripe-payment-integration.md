---
phase: requirements
title: Requirements & Problem Understanding
description: Clarify the problem space, gather requirements, and define success criteria
feature: stripe-payment-integration
---

# Requirements & Problem Understanding: Stripe Payment Integration

## Problem Statement

**What problem are we solving?**

- Currently, the restaurant ordering system only supports **Cash** and **VNPay** payment methods
- **VNPay** only works in Vietnam and requires currency conversion from USD to VND
- International guests or those preferring international payment methods (credit/debit cards) have limited options
- The system needs a globally-recognized, USD-based payment gateway
- **Who is affected?**: Restaurant guests wanting to pay with international credit/debit cards
- **Current workaround**: Guests must use Cash or VNPay (Vietnamese payment gateway)

## Goals & Objectives

**What do we want to achieve?**

### Primary Goals

- Add **Stripe Checkout** as a third payment method option
- Support **USD-only** payments through Stripe (no currency conversion needed)
- Provide a secure, PCI-compliant payment flow using Stripe's hosted checkout page
- Integrate Stripe webhooks for payment confirmation and real-time order status updates
- Set up **test/sandbox mode** for development and testing

### Secondary Goals

- Maintain consistent payment UI/UX across all payment methods
- Store Stripe transaction metadata for admin review and reconciliation
- Enable real-time Socket.io notifications when Stripe payments complete
- Track payment status in the existing payment history system

### Non-Goals (Out of Scope)

- Multi-currency support in Stripe (USD only)
- Refund functionality through admin panel (future enhancement)
- Recurring payments or subscriptions
- Production deployment (test mode only for now)
- Stripe payment element embedded in the page (using Stripe Checkout redirect instead)

## User Stories & Use Cases

**How will users interact with the solution?**

### User Story 1: Guest Pays with Stripe

**As a** restaurant guest  
**I want to** pay for my order using a credit/debit card through Stripe  
**So that** I can complete my payment securely without needing Vietnamese payment methods

**Workflow:**

1. Guest views their unpaid orders on `/guest/orders`
2. Guest selects "Stripe" as payment method (alongside Cash and VNPay)
3. Guest clicks "Pay Now"
4. System creates Stripe Checkout session and redirects to Stripe's hosted page
5. Guest enters card details on Stripe's secure page
6. After payment, guest redirects back to app with success/failure status
7. Order status updates to "Paid" in real-time

### User Story 2: Real-time Payment Confirmation

**As a** restaurant manager  
**I want to** receive instant notification when a Stripe payment completes  
**So that** I can fulfill the order immediately

**Workflow:**

1. Guest completes Stripe payment
2. Stripe webhook notifies server
3. Server updates payment and order status
4. Socket.io emits real-time update to manager dashboard
5. Manager sees order marked as "Paid"

### User Story 3: Admin Reviews Payment History

**As a** restaurant owner/manager  
**I want to** view Stripe payment details in the payment history  
**So that** I can reconcile transactions and audit payments

**Workflow:**

1. Admin views payment list at `/manage/payments`
2. Admin sees Stripe payments with transaction IDs, amounts, and card info (last 4 digits)
3. Admin can filter by payment method to see only Stripe transactions

### Edge Cases

- **Payment Cancelled**: Guest closes Stripe checkout page → redirect back with failure status
- **Webhook Failure**: Stripe webhook doesn't reach server → retry mechanism or manual verification
- **Double Payment Prevention**: Guest clicks "Pay" twice → use idempotent transaction refs
- **Network Issues**: Guest loses connection during payment → handle with proper error messages
- **No Orders to Pay**: Guest tries to pay with no pending orders → show error message

## Success Criteria

**How will we know when we're done?**

### Functional Acceptance Criteria

- ✅ Stripe appears as a payment option on `/guest/orders` page
- ✅ Clicking Stripe payment redirects to Stripe Checkout page (test mode)
- ✅ Successful payment redirects back to app with confirmation
- ✅ Order status updates to "Paid" after successful Stripe payment
- ✅ Payment record stores Stripe transaction ID, session ID, and card metadata
- ✅ Stripe webhooks trigger real-time Socket.io updates to manager dashboard
- ✅ Payment history displays Stripe payments with correct details
- ✅ Failed payments redirect back with error message
- ✅ Test mode keys are used (no production credentials)

### Technical Acceptance Criteria

- ✅ Stripe SDK (`stripe` package) installed on server
- ✅ Environment variables configured for Stripe test keys
- ✅ Webhook endpoint (`/api/payments/stripe/webhook`) secured with signature verification
- ✅ Payment controller handles Stripe Checkout session creation
- ✅ Return URL handler processes success/cancel redirects
- ✅ Database stores Stripe-specific fields (session ID, payment intent status, etc.)
- ✅ Client UI shows Stripe radio option in payment method selector

### Performance Benchmarks

- Stripe checkout session creation: < 2 seconds
- Webhook processing: < 1 second
- Real-time order update broadcast: < 500ms

## Constraints & Assumptions

**What limitations do we need to work within?**

### Technical Constraints

- **Test Mode Only**: Use Stripe test API keys, not production keys
- **USD Only**: No currency conversion or multi-currency support
- **Existing Schema**: Use current `Payment` table schema (already has Stripe fields)
- **Node.js Backend**: Fastify server with existing payment controller structure
- **React Frontend**: Next.js client with existing payment UI components

### Business Constraints

- **No Refunds**: Refund functionality deferred to future phase
- **No Disputes**: Dispute handling out of scope
- **No Subscriptions**: One-time payments only

### Assumptions

- Stripe API is available and stable
- Test credit card numbers work in sandbox mode
- Webhook delivery is reliable (with retry logic)
- Guests have internet connection for redirect flow
- SSL/HTTPS is configured for webhook endpoint (required by Stripe)

## Questions & Open Items

**What do we still need to clarify?**

### Resolved Questions ✅

- ✅ **Payment flow**: Stripe Checkout (redirect, not embedded)
- ✅ **Redirect behavior**: Return to app with payment confirmation
- ✅ **Environment**: Test/sandbox mode only
- ✅ **Currency**: USD only

### Open Items 🔄

- **Webhook URL**: What is the public webhook endpoint URL for development? (e.g., using ngrok or localhost tunnel)
- **Error Handling**: Should we log failed Stripe API calls to Sentry?
- **Card Brand Display**: Should UI show card brand icons (Visa, Mastercard, etc.)?
- **Session Expiration**: How long should Stripe Checkout sessions remain valid? (default: 24 hours)
- **Receipt Emails**: Should Stripe send email receipts to guests? (configurable in Stripe dashboard)

### Research Needed 🔍

- Review Stripe test card numbers for different scenarios (success, decline, etc.)
- Verify Stripe webhook signature validation implementation
- Check if existing Socket.io structure supports payment events
- Confirm HTTPS setup for local development (required for webhooks)
