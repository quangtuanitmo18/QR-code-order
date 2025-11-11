---
phase: planning
title: Project Planning & Task Breakdown
description: Break down work into actionable tasks and estimate timeline
feature: stripe-payment-integration
---

# Project Planning & Task Breakdown: Stripe Payment Integration

## Milestones

**What are the major checkpoints?**

- [x] **Milestone 0**: Requirements and design documentation completed
- [ ] **Milestone 1**: Backend infrastructure (Stripe SDK, config, utilities) - **Est: 2-3 hours**
- [ ] **Milestone 2**: Payment controller and webhook implementation - **Est: 3-4 hours**
- [ ] **Milestone 3**: Frontend UI integration - **Est: 2 hours**
- [ ] **Milestone 4**: Testing and validation - **Est: 2-3 hours**
- [ ] **Milestone 5**: Documentation and knowledge transfer - **Est: 1 hour**

**Total Estimated Time**: 10-13 hours

## Task Breakdown

**What specific work needs to be done?**

### Phase 1: Backend Setup (Foundation)

**Goal**: Install dependencies, configure environment, create utilities

- [ ] **Task 1.1**: Install Stripe SDK
  - Run `npm install stripe` in `server/` directory
  - Run `npm install --save-dev @types/stripe` (if needed)
  - Verify installation in `package.json`
  - **Estimate**: 5 minutes

- [ ] **Task 1.2**: Add environment variables
  - Add to `server/.env`:
    ```
    STRIPE_SECRET_KEY=sk_test_xxxxx
    STRIPE_WEBHOOK_SECRET=whsec_xxxxx
    STRIPE_RETURN_URL=http://localhost:4000/api/payments/stripe/return
    ```
  - Update `server/src/config.ts` to validate new env vars
  - **Estimate**: 10 minutes
  - **Note**: Test keys from Stripe Dashboard → Developers → API keys

- [ ] **Task 1.3**: Create Stripe utility file
  - Create `server/src/utils/stripe.ts`
  - Implement:
    - `stripe` client initialization
    - `createStripeCheckoutSession()` function
    - `verifyStripeWebhook()` function
  - Add TypeScript types for parameters
  - **Estimate**: 30 minutes
  - **Reference**: Design doc section "Stripe Utility"

- [ ] **Task 1.4**: Update constants
  - Add `Stripe` to `PaymentMethod` enum in `server/src/constants/type.ts`
  - Update `PaymentMethodValues` array
  - Mirror changes in `client/src/constants/type.ts`
  - **Estimate**: 10 minutes

### Phase 2: Core Payment Logic (Backend)

**Goal**: Implement Stripe payment flow in controller and routes

- [ ] **Task 2.1**: Implement `processStripePayment` function
  - Location: `server/src/controllers/payment.controller.ts`
  - Create async function that:
    1. Receives guest ID, amount, transaction ref, description
    2. Calls `createStripeCheckoutSession()`
    3. Creates `Payment` record with `status: "Pending"`
    4. Stores `externalSessionId` from Stripe
    5. Returns payment object and checkout URL
  - **Estimate**: 45 minutes
  - **Edge cases**: Handle Stripe API errors, validate amount > 0

- [ ] **Task 2.2**: Modify `createPaymentController`
  - Add `else if (paymentMethod === PaymentMethod.Stripe)` case
  - Call `processStripePayment()`
  - Convert USD amount to cents (multiply by 100)
  - **Estimate**: 20 minutes

- [ ] **Task 2.3**: Implement Stripe return URL handler
  - Location: `server/src/routes/payment.route.ts`
  - Create `GET /stripe/return` endpoint
  - Extract `session_id` from query params
  - Fetch session from Stripe API
  - Redirect to client: `/guest/orders/payment-result?...`
  - **Estimate**: 30 minutes

- [ ] **Task 2.4**: Implement webhook handler
  - Location: `server/src/routes/payment.route.ts`
  - Create `POST /stripe/webhook` endpoint
  - Enable raw body parsing (required for signature verification)
  - Verify webhook signature using `verifyStripeWebhook()`
  - Handle events:
    - `checkout.session.completed`
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
  - **Estimate**: 60 minutes
  - **Critical**: Test with Stripe CLI

- [ ] **Task 2.5**: Implement `verifyStripePaymentController`
  - Location: `server/src/controllers/payment.controller.ts`
  - Process webhook event payload
  - Update `Payment` record:
    - Set `status: "Success"` or `"Failed"`
    - Store `externalTransactionId` (payment intent ID)
    - Store `cardBrand`, `last4Digits`
    - Set `paidAt` timestamp
  - Update related `Orders` to `status: "Paid"`
  - Return updated payment and orders
  - **Estimate**: 45 minutes

- [ ] **Task 2.6**: Add Socket.io notification
  - In webhook handler, after payment update:
    - Get guest's socket ID from database
    - Emit `payment` event to guest socket
    - Emit to `ManagerRoom` for dashboard update
  - **Estimate**: 15 minutes
  - **Pattern**: Follow existing VNPay webhook implementation

### Phase 3: Frontend Integration

**Goal**: Add Stripe option to UI and handle redirects

- [ ] **Task 3.1**: Update payment method selector
  - Location: `client/src/app/[locale]/guest/orders/orders-cart.tsx`
  - Add third `<RadioGroupItem>` for Stripe
  - Label: "💳 Stripe (Credit/Debit Card - USD)"
  - Value: `PaymentMethod.Stripe`
  - **Estimate**: 10 minutes

- [ ] **Task 3.2**: Modify payment handler
  - In `handlePayment()` function
  - When `selectedPaymentMethod === PaymentMethod.Stripe`:
    - Call API with `paymentMethod: "Stripe"`, `currency: "USD"`
    - Receive `paymentUrl` from response
    - Redirect: `window.location.href = paymentUrl`
  - **Estimate**: 15 minutes

- [ ] **Task 3.3**: Update payment result page (if needed)
  - Location: `client/src/app/[locale]/guest/orders/payment-result/page.tsx`
  - Ensure it handles `method=Stripe` query param
  - Display appropriate success/failure message for Stripe
  - **Estimate**: 20 minutes
  - **Note**: May already work if implementation is generic

- [ ] **Task 3.4**: Update payment list UI (admin)
  - Location: Admin payment history component
  - Display Stripe-specific fields:
    - Card brand icon (Visa, Mastercard, etc.)
    - Last 4 digits
    - Stripe transaction ID
  - **Estimate**: 30 minutes
  - **Optional**: Can defer to future enhancement

### Phase 4: Testing & Validation

**Goal**: Ensure everything works end-to-end

- [ ] **Task 4.1**: Set up Stripe CLI for webhook testing
  - Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (or download)
  - Login: `stripe login`
  - Forward webhooks: `stripe listen --forward-to localhost:4000/api/payments/stripe/webhook`
  - Copy webhook signing secret to `.env`
  - **Estimate**: 15 minutes
  - **Docs**: https://stripe.com/docs/stripe-cli

- [ ] **Task 4.2**: Test successful payment flow
  - Start server and client
  - Login as guest
  - Add items to cart
  - Select "Stripe" payment method
  - Click "Pay Now"
  - Redirects to Stripe Checkout
  - Enter test card: `4242 4242 4242 4242`, future expiry, any CVC
  - Complete payment
  - Verify redirect back with success
  - Verify order status changed to "Paid"
  - Verify payment record in database
  - **Estimate**: 20 minutes

- [ ] **Task 4.3**: Test failed payment flow
  - Repeat above with declined test card: `4000 0000 0000 0002`
  - Verify failure handling
  - Verify order remains unpaid
  - **Estimate**: 10 minutes

- [ ] **Task 4.4**: Test webhook delivery
  - Monitor Stripe CLI output during payment
  - Verify webhook events received
  - Verify signature verification passes
  - Verify database updates triggered
  - Check Socket.io real-time updates on manager dashboard
  - **Estimate**: 20 minutes

- [ ] **Task 4.5**: Test edge cases
  - Guest cancels checkout (clicks back button)
  - Guest loses internet during payment
  - Webhook fails (simulate by stopping server)
  - Double payment prevention (click "Pay" twice)
  - No orders to pay (empty cart)
  - **Estimate**: 30 minutes

- [ ] **Task 4.6**: Test admin payment view
  - Login as owner/manager
  - View payment history
  - Find Stripe payment
  - Verify all fields display correctly
  - **Estimate**: 10 minutes

### Phase 5: Documentation & Polish

**Goal**: Finalize docs and clean up

- [ ] **Task 5.1**: Update implementation docs
  - Document actual code structure
  - Note any deviations from design
  - Add code snippets for key functions
  - **Estimate**: 20 minutes

- [ ] **Task 5.2**: Update testing docs
  - Record test results
  - Document test card numbers
  - Add troubleshooting tips
  - **Estimate**: 15 minutes

- [ ] **Task 5.3**: Create setup guide
  - Steps to get Stripe test keys
  - Environment variable setup
  - Stripe CLI installation
  - Webhook configuration
  - **Estimate**: 15 minutes

- [ ] **Task 5.4**: Code cleanup
  - Remove console.logs
  - Add comments to complex logic
  - Format code with Prettier
  - Run linter and fix issues
  - **Estimate**: 15 minutes

## Dependencies

**What needs to happen in what order?**

### Critical Path

```
Task 1.1 (Install Stripe)
  → Task 1.2 (Env vars)
  → Task 1.3 (Utilities)
  → Task 2.1 (processStripePayment)
  → Task 2.2 (createPaymentController)
  → Task 2.4 (Webhook handler)
  → Task 2.5 (verifyStripePaymentController)
  → Task 4.1 (Stripe CLI)
  → Task 4.2 (E2E test)
```

### Parallel Tasks

- Task 1.4 (Constants) can run parallel with Task 1.3
- Task 3.1-3.3 (Frontend) can start after Task 2.2 (backend payment API works)
- Task 2.3 (Return URL) can be done anytime after Task 1.3
- Task 4.3-4.6 (Tests) can run in any order after Task 4.2 passes

### External Dependencies

- **Stripe Account**: Need test API keys (free, instant signup)
- **Stripe CLI**: Required for local webhook testing
- **HTTPS/ngrok**: If webhooks need to work from external Stripe servers (optional, Stripe CLI is easier for local dev)
- **Documentation Access**: Stripe API docs (stripe.com/docs)

## Timeline & Estimates

**When will things be done?**

### Development Timeline (Single Developer)

- **Day 1 Morning (3-4 hours)**: Phase 1 + Phase 2 (Tasks 1.1-2.3)
- **Day 1 Afternoon (2-3 hours)**: Phase 2 completion (Tasks 2.4-2.6)
- **Day 2 Morning (2 hours)**: Phase 3 (Frontend integration)
- **Day 2 Afternoon (3 hours)**: Phase 4 (Testing)
- **Day 2 End (1 hour)**: Phase 5 (Documentation)

**Total: 2 working days (10-13 hours)**

### Milestones Dates (Example)

- Milestone 1: End of Day 1 Morning
- Milestone 2: End of Day 1 Afternoon
- Milestone 3: End of Day 2 Morning
- Milestone 4: End of Day 2 Afternoon
- Milestone 5: End of Day 2

## Risks & Mitigation

**What could go wrong?**

### Technical Risks

| Risk                                 | Impact | Probability | Mitigation                                                        |
| ------------------------------------ | ------ | ----------- | ----------------------------------------------------------------- |
| Stripe API rate limits               | Medium | Low         | Use test mode (higher limits), implement exponential backoff      |
| Webhook signature verification fails | High   | Medium      | Use Stripe CLI for local testing, verify raw body parsing         |
| Double payment on retry              | High   | Low         | Use idempotent `transactionRef`, check existing payments          |
| Webhook delivery delays              | Medium | Medium      | Implement webhook retry handling, allow manual status check       |
| HTTPS required for webhooks          | Low    | Low         | Use Stripe CLI for local dev (no HTTPS needed)                    |
| Currency conversion confusion        | Low    | Low         | Clear UI labels ("USD only"), validate currency on backend        |
| Test card numbers not working        | Low    | Low         | Use official Stripe test cards, check Stripe dashboard for issues |

### Resource Risks

| Risk                           | Impact | Probability | Mitigation                                                             |
| ------------------------------ | ------ | ----------- | ---------------------------------------------------------------------- |
| Stripe account approval delay  | Low    | Very Low    | Test mode works immediately, no approval needed                        |
| Missing environment variables  | Medium | Medium      | Validate config on startup, provide clear error messages               |
| Stripe CLI installation issues | Low    | Low         | Provide alternative: use Stripe dashboard to manually trigger webhooks |

### Mitigation Strategies

1. **Start with Stripe CLI**: Easier than ngrok for local webhook testing
2. **Incremental Testing**: Test each component before moving to next phase
3. **Fallback to Session Lookup**: If webhook fails, can query Stripe API directly
4. **Error Logging**: Log all Stripe API errors for debugging
5. **Test Mode**: Use sandbox environment to avoid real money issues

## Resources Needed

**What do we need to succeed?**

### Team Members and Roles

- **1 Full-stack Developer**: Implement backend + frontend
- **1 QA Tester** (optional): Manual testing of payment flows
- **1 DevOps** (optional): Help with webhook endpoint setup if using ngrok

### Tools and Services

1. **Stripe Account** (free)
   - Sign up: https://dashboard.stripe.com/register
   - Get test API keys: Dashboard → Developers → API keys
   - Enable webhooks: Dashboard → Developers → Webhooks

2. **Stripe CLI** (free)
   - Install: https://stripe.com/docs/stripe-cli
   - Purpose: Local webhook testing

3. **Development Environment**
   - Node.js 18+
   - npm/yarn
   - SQLite database (already set up)
   - Git for version control

4. **Optional: ngrok** (free tier)
   - Purpose: Expose local server to internet for webhook testing
   - Alternative to Stripe CLI

### Infrastructure

- **No changes needed**: Existing Fastify server and Next.js client
- **Database**: No migration needed (schema already supports Stripe)
- **Environment**: Test mode only (no production infrastructure)

### Documentation/Knowledge

1. **Stripe Checkout Docs**: https://stripe.com/docs/payments/checkout
2. **Stripe Webhooks Guide**: https://stripe.com/docs/webhooks
3. **Stripe Test Cards**: https://stripe.com/docs/testing
4. **Stripe Node.js SDK**: https://github.com/stripe/stripe-node
5. **Project Docs**: `docs/ai/requirements/`, `docs/ai/design/`

### Access Requirements

- Stripe dashboard access (individual developer account is fine)
- Repository write access (to commit code)
- Server environment variables (`.env` file)
- Database access (SQLite local file)

## Implementation Order (Recommended)

**Follow this sequence for smooth development:**

1. ✅ Read requirements and design docs thoroughly
2. ▶️ **Start here**: Task 1.1 (Install Stripe SDK)
3. Task 1.2 → 1.3 → 1.4 (Setup and utilities)
4. Task 2.1 → 2.2 (Payment creation)
5. Task 2.3 (Return URL handler)
6. Task 4.1 (Set up Stripe CLI - do early to test webhooks)
7. Task 2.4 → 2.5 → 2.6 (Webhook implementation)
8. Task 3.1 → 3.2 → 3.3 (Frontend integration)
9. Task 4.2 → 4.3 → 4.4 → 4.5 (Testing)
10. Task 3.4 (Admin UI - optional)
11. Task 5.1 → 5.2 → 5.3 → 5.4 (Documentation and cleanup)

**Total Tasks**: 27 tasks across 5 phases

---

## Next Steps

When ready to start implementation, run `/execute-plan` command to work through tasks interactively!
