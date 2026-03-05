import { expect, test } from '../fixtures'

/**
 * E2E Tests — Guest Order Flow
 *
 * The guestPage fixture auto-logs in and navigates to /guest/menu.
 * These tests verify:
 * 1. Menu page displays dishes
 * 2. Guest can add dishes and place an order
 * 3. Order button is disabled when no dishes are selected
 */

test.describe('Guest Order Flow', () => {
  test('guest can browse the menu', async ({ guestPage }) => {
    // guestPage fixture already logged in and navigated to /guest/menu
    await expect(guestPage).toHaveURL(/\/guest\/menu/)

    // Verify the menu heading is visible
    await expect(guestPage.getByRole('heading', { name: /menu/i })).toBeVisible()

    // Verify the order button exists (disabled since no dishes selected)
    const orderButton = guestPage.getByRole('button', { name: /order/i })
    await expect(orderButton).toBeVisible()
    await expect(orderButton).toBeDisabled()
  })

  test('guest can add dishes and place an order', async ({ guestPage }) => {
    // guestPage is on /guest/menu
    await expect(guestPage).toHaveURL(/\/guest\/menu/)
    await guestPage.waitForLoadState('networkidle')

    // Wait for dish cards to load (each dish has a h3 with the name)
    const dishCards = guestPage.locator('h3')
    await expect(dishCards.first()).toBeVisible({ timeout: 15000 })

    // Click the "+" button in the first dish's quantity control
    // The Quantity component renders: [- button] [input] [+ button]
    // We target the second button (Plus) in the first dish card's quantity section
    const firstDishQuantityPlus = guestPage.locator('.grid > div').first().locator('button').last()
    await firstDishQuantityPlus.click()

    // Verify the order button is now enabled and shows count
    const orderButton = guestPage.getByRole('button', { name: /order/i })
    await expect(orderButton).toBeEnabled()
    await expect(orderButton).toContainText('1 dish')

    // Place the order
    await orderButton.click()

    // Should redirect to orders page
    await guestPage.waitForURL(/\/guest\/orders/, { timeout: 15000 })

    // Verify orders are displayed
    await expect(guestPage.getByText(/order #/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('order button is disabled with zero dishes', async ({ guestPage }) => {
    await expect(guestPage).toHaveURL(/\/guest\/menu/)

    // The order button should be disabled when no dishes are selected
    const orderButton = guestPage.getByRole('button', { name: /order/i })
    await expect(orderButton).toBeDisabled()
  })
})
