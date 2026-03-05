import { expect, test } from '../fixtures'

/**
 * E2E Tests — Cash Payment Flow
 *
 * Tests the guest cash payment flow:
 * 1. guestPage fixture logs in and navigates to menu
 * 2. Guest adds dishes and places an order
 * 3. On the orders page, selects "Cash" payment method
 * 4. Clicks "Pay" button
 * 5. Verifies payment success toast
 */

test.describe('Cash Payment Flow', () => {
  test('guest can pay with cash', async ({ guestPage }) => {
    // ─── Step 1: guestPage is already on /guest/menu ──────────────
    await expect(guestPage).toHaveURL(/\/guest\/menu/)
    await guestPage.waitForLoadState('networkidle')

    // ─── Step 2: Add a dish to the order ──────────────────────────
    // Wait for dishes to load
    const dishCards = guestPage.locator('h3')
    await expect(dishCards.first()).toBeVisible({ timeout: 15000 })

    // Click "+" on the first dish
    const firstDishQuantityPlus = guestPage.locator('.grid > div').first().locator('button').last()
    await firstDishQuantityPlus.click()

    // ─── Step 3: Place the order ──────────────────────────────────
    const orderButton = guestPage.getByRole('button', { name: /order/i })
    await expect(orderButton).toBeEnabled()
    await orderButton.click()

    // ─── Step 4: Wait for orders page ─────────────────────────────
    // Handle case where page may already be on orders page or redirect is slow
    if (!guestPage.url().includes('/guest/orders')) {
      await guestPage.waitForURL(/\/guest\/orders/, { timeout: 30000 })
    }
    await guestPage.waitForLoadState('networkidle')

    // Verify order is displayed
    await expect(guestPage.getByText(/order #/i).first()).toBeVisible({ timeout: 15000 })

    // Verify "Waiting for paying" section is visible
    await expect(guestPage.getByText(/waiting for paying/i)).toBeVisible({ timeout: 15000 })

    // ─── Step 5: Select Cash payment method ───────────────────────
    // Cash is the default, but click it explicitly to be sure
    const cashRadio = guestPage.locator('#cash')
    await expect(cashRadio).toBeChecked()
    await cashRadio.click()

    // ─── Step 6: Click Pay button ─────────────────────────────────
    const payButton = guestPage.getByRole('button', { name: /^pay /i })
    await expect(payButton).toBeVisible()
    await expect(payButton).toBeEnabled()
    await payButton.click()

    // ─── Step 7: Verify payment success ───────────────────────────
    // The app shows a toast with "Payment Successful"
    await expect(guestPage.getByText('Payment Successful', { exact: true })).toBeVisible({
      timeout: 15000,
    })
  })

  test('cash is selected by default', async ({ guestPage }) => {
    // Setup: add a dish and place an order
    await expect(guestPage).toHaveURL(/\/guest\/menu/)
    await guestPage.waitForLoadState('networkidle')

    const dishCards = guestPage.locator('h3')
    await expect(dishCards.first()).toBeVisible({ timeout: 15000 })

    const firstDishQuantityPlus = guestPage.locator('.grid > div').first().locator('button').last()
    await firstDishQuantityPlus.click()

    await guestPage.getByRole('button', { name: /order/i }).click()
    await guestPage.waitForURL(/\/guest\/orders/, { timeout: 15000 })
    await guestPage.waitForLoadState('networkidle')

    // Wait for payment section to appear
    await expect(guestPage.getByText(/waiting for paying/i)).toBeVisible({ timeout: 15000 })

    // Verify Cash is selected by default
    const cashRadio = guestPage.locator('#cash')
    await expect(cashRadio).toBeChecked()
  })
})
