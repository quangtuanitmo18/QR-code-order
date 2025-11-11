---
phase: testing
title: Testing Strategy
description: Define testing approach, test cases, and quality assurance
feature: stripe-payment-integration
---

# Testing Strategy: Stripe Payment Integration

## Test Coverage Goals

**What level of testing do we aim for?**

- **Unit test coverage target**: 100% of new code (utility functions, controllers)
- **Integration test scope**: Payment flow end-to-end, webhook handling, database updates
- **End-to-end test scenarios**: Full guest payment journey, manager dashboard updates
- **Manual testing**: UI/UX validation, browser compatibility, Stripe Dashboard verification
- **Alignment with requirements**: All success criteria from requirements doc must be testable

## Unit Tests

**What individual components need testing?**

### Component 1: Stripe Utilities (`server/src/utils/stripe.ts`)

- [ ] **Test: createStripeCheckoutSession - Success**
  - Input: Valid amount, transactionRef, description
  - Expected: Returns session object with valid URL and ID
  - Coverage: Happy path

- [ ] **Test: createStripeCheckoutSession - Invalid Amount**
  - Input: Negative or zero amount
  - Expected: Throws error "Amount must be positive"
  - Coverage: Input validation

- [ ] **Test: createStripeCheckoutSession - Missing Required Fields**
  - Input: Missing transactionRef or description
  - Expected: Throws error with specific field name
  - Coverage: Required field validation

- [ ] **Test: verifyStripeWebhook - Valid Signature**
  - Input: Valid payload and signature from Stripe CLI
  - Expected: Returns Stripe Event object
  - Coverage: Webhook verification success

- [ ] **Test: verifyStripeWebhook - Invalid Signature**
  - Input: Valid payload but wrong signature
  - Expected: Throws error "Webhook signature verification failed"
  - Coverage: Security validation

- [ ] **Test: getStripeSession - Valid Session ID**
  - Input: Valid session ID (cs_test_xxx)
  - Expected: Returns session object with payment intent expanded
  - Coverage: Session retrieval

- [ ] **Test: getStripeSession - Invalid Session ID**
  - Input: Non-existent session ID
  - Expected: Throws error "No such checkout session"
  - Coverage: Error handling

### Component 2: Payment Controller (`server/src/controllers/payment.controller.ts`)

- [ ] **Test: processStripePayment - Success**
  - Input: Valid guest ID, amount $10.50, orders
  - Expected: Creates payment record, returns session URL
  - Verify: Payment status is "Pending", amount stored in USD
  - Coverage: Payment creation flow

- [ ] **Test: processStripePayment - Currency Conversion**
  - Input: Amount $10.50 (USD)
  - Expected: Stripe session created with 1050 cents
  - Verify: Metadata contains correct amountInCents
  - Coverage: USD to cents conversion

- [ ] **Test: createPaymentController - Stripe Method**
  - Input: paymentMethod: "Stripe", currency: "USD"
  - Expected: Calls processStripePayment, returns paymentUrl
  - Coverage: Method routing

- [ ] **Test: verifyStripePaymentController - checkout.session.completed**
  - Input: Stripe event with completed session
  - Expected: Payment remains "Pending" (wait for payment_intent)
  - Coverage: Event handling (intermediate state)

- [ ] **Test: verifyStripePaymentController - payment_intent.succeeded**
  - Input: Stripe event with succeeded payment intent
  - Expected: Payment updated to "Success", orders marked "Paid"
  - Verify: externalTransactionId, cardBrand, last4Digits stored
  - Coverage: Successful payment confirmation

- [ ] **Test: verifyStripePaymentController - payment_intent.failed**
  - Input: Stripe event with failed payment intent
  - Expected: Payment updated to "Failed", orders remain unpaid
  - Coverage: Failed payment handling

- [ ] **Test: verifyStripePaymentController - Idempotency**
  - Input: Process same event twice
  - Expected: Second call returns existing data, no duplicate updates
  - Coverage: Duplicate event protection

- [ ] **Test: verifyStripePaymentController - Missing Transaction Ref**
  - Input: Event without metadata.transactionRef
  - Expected: Throws error "Transaction reference not found"
  - Coverage: Error handling

### Component 3: Payment Routes (`server/src/routes/payment.route.ts`)

- [ ] **Test: GET /stripe/return - Success**
  - Input: session_id=cs_test_xxx, success=true
  - Expected: Redirects to /guest/orders/payment-result?success=true
  - Coverage: Return URL handling

- [ ] **Test: GET /stripe/return - Cancelled**
  - Input: session_id=cs_test_xxx, success=false
  - Expected: Redirects to /guest/orders/payment-result?success=false
  - Coverage: Cancel flow

- [ ] **Test: GET /stripe/return - Missing Session ID**
  - Input: No session_id parameter
  - Expected: Redirects to error page with message
  - Coverage: Missing parameter handling

- [ ] **Test: POST /stripe/webhook - Valid Signature**
  - Input: Valid Stripe event with correct signature
  - Expected: Returns 200 OK, { received: true }
  - Coverage: Webhook authentication

- [ ] **Test: POST /stripe/webhook - Invalid Signature**
  - Input: Event with wrong signature
  - Expected: Returns 400 Bad Request
  - Coverage: Security validation

- [ ] **Test: POST /stripe/webhook - Socket.io Emission**
  - Input: Successful payment event
  - Expected: Emits "payment" event to guest socket and ManagerRoom
  - Coverage: Real-time notification

## Integration Tests

**How do we test component interactions?**

### Integration Test 1: End-to-End Payment Flow

- [ ] **Scenario**: Guest creates Stripe payment
  1. Create guest and orders in database
  2. Call `POST /api/guest/orders/create-payment` with Stripe method
  3. Verify payment record created in database
  4. Verify Stripe session created (check Stripe API)
  5. Verify paymentUrl returned in response
  - **Expected**: Payment created, session active, URL valid

### Integration Test 2: Webhook to Database Update

- [ ] **Scenario**: Webhook updates payment and orders
  1. Create pending payment in database
  2. Simulate `payment_intent.succeeded` webhook call
  3. Verify payment status changed to "Success"
  4. Verify orders status changed to "Paid"
  5. Verify payment metadata updated
  - **Expected**: Database reflects successful payment

### Integration Test 3: Return URL to Client Redirect

- [ ] **Scenario**: Guest returns from Stripe
  1. Call `GET /api/payments/stripe/return?session_id=xxx`
  2. Verify redirect to client URL
  3. Verify query params include success, amount, txnRef
  - **Expected**: Correct redirect with parameters

### Integration Test 4: Webhook Signature Verification

- [ ] **Scenario**: Reject invalid webhook
  1. Send webhook with invalid signature
  2. Verify 400 status code returned
  3. Verify no database changes
  - **Expected**: Webhook rejected, data unchanged

### Integration Test 5: Socket.io Real-time Update

- [ ] **Scenario**: Manager receives payment notification
  1. Connect mock manager socket to ManagerRoom
  2. Trigger successful payment webhook
  3. Verify "payment" event received on manager socket
  4. Verify event payload contains updated orders
  - **Expected**: Real-time notification sent

### Integration Test 6: Double Payment Prevention

- [ ] **Scenario**: Process duplicate webhook event
  1. Send `payment_intent.succeeded` event
  2. Verify payment updated to "Success"
  3. Send same event again
  4. Verify no duplicate order updates
  5. Verify only one payment record exists
  - **Expected**: Idempotent handling works

## End-to-End Tests

**What user flows need validation?**

### E2E Test 1: Guest Pays with Stripe Successfully

- [ ] **Flow**:
  1. Guest logs in
  2. Guest adds dishes to cart (3 items, total $25.50)
  3. Guest navigates to `/guest/orders`
  4. Guest selects "Stripe" payment method
  5. Guest clicks "Pay Now"
  6. Guest redirects to Stripe Checkout page
  7. Guest enters test card: `4242 4242 4242 4242`
  8. Guest completes payment
  9. Guest redirects back to app
  10. Orders show "Paid" status
  11. Manager dashboard updates in real-time
  - **Expected**: Full payment flow works, orders marked paid

### E2E Test 2: Guest Cancels Stripe Payment

- [ ] **Flow**:
  1. Guest starts payment (steps 1-6 above)
  2. Guest clicks "Back" button on Stripe page
  3. Guest redirects back to app with cancel message
  4. Orders remain "Pending"
  5. Payment status remains "Pending"
  - **Expected**: Cancel flow works, no charges

### E2E Test 3: Guest Payment Fails (Declined Card)

- [ ] **Flow**:
  1. Guest starts payment (steps 1-6 above)
  2. Guest enters declined test card: `4000 0000 0000 0002`
  3. Stripe shows "Card declined" error
  4. Guest redirects back to app with failure message
  5. Orders remain unpaid
  - **Expected**: Decline handled gracefully

### E2E Test 4: Manager Views Stripe Payment History

- [ ] **Flow**:
  1. Manager logs in
  2. Manager navigates to `/manage/payments`
  3. Manager sees Stripe payment in list
  4. Manager clicks payment to view details
  5. Manager sees card brand, last 4 digits, transaction ID
  - **Expected**: Payment details displayed correctly

### E2E Test 5: Network Failure During Payment

- [ ] **Flow**:
  1. Guest starts payment
  2. Disconnect network during Stripe checkout
  3. Guest reconnects
  4. Verify webhook still processes when network restores
  5. Verify orders update correctly
  - **Expected**: Robust to network issues

## Test Data

**What data do we use for testing?**

### Stripe Test Card Numbers

```
✅ Successful Payment:
   4242 4242 4242 4242 (Visa)
   5555 5555 5555 4444 (Mastercard)
   3782 822463 10005 (Amex)

❌ Declined Payment:
   4000 0000 0000 0002 (Generic decline)
   4000 0000 0000 9995 (Insufficient funds)
   4000 0000 0000 9987 (Lost card)

⏱️ Special Cases:
   4000 0000 0000 9979 (Card stolen, triggers webhook)
   4000 0082 6000 0000 (3D Secure authentication required)

Expiry: Any future date (e.g., 12/25)
CVC: Any 3-4 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Test Database Fixtures

```typescript
// Guest
const testGuest = {
  id: 999,
  name: 'Test Guest',
  tableNumber: 5,
  refreshToken: 'test_token_xxx',
}

// Dishes
const testDishes = [
  { id: 1, name: 'Burger', price: 10, quantity: 2 }, // $20
  { id: 2, name: 'Fries', price: 5.5, quantity: 1 }, // $5.50
] // Total: $25.50

// Payment
const testPayment = {
  transactionRef: 'PAY_999_1699876543210',
  amount: 25.5,
  currency: 'USD',
  paymentMethod: 'Stripe',
  status: 'Pending',
}
```

### Mock Stripe Events

```typescript
// Webhook event payload (payment_intent.succeeded)
const mockStripeEvent = {
  id: 'evt_test_xxx',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_xxx',
      amount: 2550, // $25.50 in cents
      currency: 'usd',
      status: 'succeeded',
      payment_method: 'pm_test_xxx',
      metadata: {
        transactionRef: 'PAY_999_1699876543210',
      },
    },
  },
}
```

## Test Reporting & Coverage

**How do we verify and communicate test results?**

### Coverage Commands

```bash
# Run unit tests with coverage
cd server
npm run test -- --coverage

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage:report
```

### Coverage Thresholds

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 90,
        "functions": 100,
        "lines": 95,
        "statements": 95
      },
      "./src/utils/stripe.ts": {
        "functions": 100,
        "lines": 100
      },
      "./src/controllers/payment.controller.ts": {
        "functions": 95,
        "lines": 95
      }
    }
  }
}
```

### Coverage Gaps (Acceptable)

- **Stripe API mocks**: Some edge cases may be hard to mock (e.g., network timeouts)
- **Socket.io events**: Real-time testing requires manual verification
- **Stripe CLI integration**: Webhook signature generation is handled by Stripe

### Test Reports

- **Unit Tests**: JUnit XML format for CI/CD integration
- **Coverage**: HTML report in `server/coverage/lcov-report/index.html`
- **Manual Tests**: Checklist in this document (see below)

## Manual Testing

**What requires human validation?**

### UI/UX Testing Checklist

- [ ] **Payment Method Selector**
  - [ ] Stripe radio button displays correctly
  - [ ] Label text is clear: "Stripe (Credit/Debit Card - USD)"
  - [ ] Icon (💳) renders properly
  - [ ] Radio button can be selected and deselected
  - [ ] Active state styling works

- [ ] **Payment Button**
  - [ ] "Pay Now" button enabled when Stripe selected
  - [ ] Loading spinner shows during API call
  - [ ] Button disabled while loading
  - [ ] Error message displays if API fails

- [ ] **Stripe Checkout Page**
  - [ ] Redirects to Stripe-hosted page
  - [ ] Page loads quickly (< 2 seconds)
  - [ ] Restaurant name/description visible
  - [ ] Amount displays correctly in USD
  - [ ] Test mode badge visible (top-right corner)

- [ ] **Return Flow**
  - [ ] Success: Redirects to success page with confirmation
  - [ ] Cancel: Redirects to orders page with message
  - [ ] Success message is clear and celebratory
  - [ ] Order status updates without refresh

- [ ] **Payment History (Admin)**
  - [ ] Stripe payments appear in list
  - [ ] Card brand icon shows (Visa, Mastercard, etc.)
  - [ ] Last 4 digits masked correctly (••••1234)
  - [ ] Transaction ID is clickable (optional)
  - [ ] Timestamp is accurate

### Browser/Device Compatibility

- [ ] **Desktop Browsers**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Mobile Browsers**
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Mobile responsiveness (button sizes, text)

- [ ] **Stripe Checkout Mobile**
  - [ ] Checkout page is mobile-optimized
  - [ ] Card input works on mobile keyboard
  - [ ] Autofill works (if saved cards)

### Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces payment method options
- [ ] Focus states visible on all interactive elements
- [ ] Color contrast meets WCAG AA standards
- [ ] Error messages are descriptive and helpful

### Smoke Tests After Deployment

- [ ] Guest can log in
- [ ] Orders can be created
- [ ] Stripe payment option appears
- [ ] Payment redirects to Stripe
- [ ] Test payment completes successfully
- [ ] Webhook processes correctly
- [ ] Manager dashboard shows real-time update

## Performance Testing

**How do we validate performance?**

### Load Testing Scenarios

- [ ] **Concurrent Payments**
  - Simulate 10 guests paying simultaneously
  - Expected: All payments process successfully
  - Metric: < 3 seconds to create checkout session

- [ ] **Webhook Flood**
  - Send 100 webhook events rapidly
  - Expected: All events processed correctly
  - Metric: < 1 second per webhook

- [ ] **Database Query Performance**
  - Test with 1000+ payment records
  - Expected: Payment list loads quickly
  - Metric: < 500ms query time

### Stress Testing Approach

- Use `artillery` or `k6` for load testing
- Target: 100 requests/second for 1 minute
- Monitor: CPU, memory, database connections

### Performance Benchmarks

| Metric                        | Target  | Acceptable | Critical |
| ----------------------------- | ------- | ---------- | -------- |
| Checkout session creation     | < 2s    | < 3s       | > 5s     |
| Webhook processing            | < 1s    | < 2s       | > 3s     |
| Return URL redirect           | < 500ms | < 1s       | > 2s     |
| Database query (payment list) | < 500ms | < 1s       | > 2s     |

## Bug Tracking

**How do we manage issues?**

### Issue Tracking Process

1. **Report**: File issue in GitHub/GitLab with label `stripe-payment`
2. **Triage**: Assign severity (Critical, High, Medium, Low)
3. **Reproduce**: Add steps to reproduce in issue description
4. **Fix**: Create branch `fix/stripe-[issue-number]`
5. **Test**: Verify fix with test case
6. **Close**: Merge and close issue

### Bug Severity Levels

- **Critical**: Payment fails, data loss, security vulnerability
- **High**: Feature broken, affects all users
- **Medium**: Minor issue, workaround available
- **Low**: Cosmetic issue, typo, minor UX improvement

### Regression Testing Strategy

- **After each fix**: Run full test suite
- **Before deployment**: Manual smoke tests
- **After deployment**: Monitor Stripe Dashboard for errors

---

## Testing Timeline

### Pre-Implementation Testing

- [x] Review Stripe test card documentation
- [x] Set up Stripe test account
- [x] Install Stripe CLI

### During Implementation Testing

- [ ] Unit test each function as it's written
- [ ] Run integration tests after each milestone
- [ ] Manual test UI after frontend changes

### Post-Implementation Testing

- [ ] Full E2E test suite (all 5 scenarios)
- [ ] Browser compatibility testing
- [ ] Accessibility audit
- [ ] Performance benchmarking
- [ ] Security review (webhook signature, env vars)

### Pre-Deployment Testing

- [ ] Code review with peer
- [ ] Final smoke test on staging
- [ ] Verify Stripe Dashboard test mode active
- [ ] Check environment variables configured

### Post-Deployment Testing

- [ ] Monitor first 10 real payments
- [ ] Check Stripe Dashboard for errors
- [ ] Verify webhook delivery (Stripe Dashboard → Webhooks)
- [ ] Review Sentry/logs for any errors

---

## Test Results Summary (To be filled during testing)

### Unit Tests

- **Total Tests**: **/**
- **Passed**: \_\_
- **Failed**: \_\_
- **Coverage**: \_\_%

### Integration Tests

- **Total Tests**: **/**
- **Passed**: \_\_
- **Failed**: \_\_

### E2E Tests

- **Total Scenarios**: 5/5
- **Passed**: \_\_
- **Failed**: \_\_

### Manual Tests

- **UI/UX**: **/** items checked
- **Browser Compatibility**: **/** browsers tested
- **Accessibility**: **/** checks passed

### Performance

- **Checkout session creation**: \_\_s (target: < 2s)
- **Webhook processing**: \_\_s (target: < 1s)
- **Return URL redirect**: \_\_ms (target: < 500ms)

---

**Ready to test? Start with unit tests (Task 4.1-4.6 in planning doc)!**
