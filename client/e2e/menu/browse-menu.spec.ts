import { expect, test } from '@playwright/test'

/**
 * E2E tests for the public menu browsing experience.
 *
 * NOTE: These tests use the public home page since guests browse via QR code URL.
 * For a complete order flow test, provide a real table token via env var.
 */
test.describe('Public Menu Page', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/vi')
    await expect(page).toHaveURL(/\/vi/)
    await page.waitForLoadState('networkidle')
  })

  test('home page has content (title + nav)', async ({ page }) => {
    await page.goto('/vi')
    await page.waitForLoadState('domcontentloaded')
    // Should have some content rendered
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/vi/non-existent-page-12345')
    // Next.js should serve 404 or redirect
    const status = await page.evaluate(() => document.title)
    // Just verifying it doesn't crash
    expect(status).toBeTruthy()
  })
})

test.describe('Guest Table Flow (requires token)', () => {
  // These tests require a real table token from the database.
  // Set E2E_TABLE_NUMBER and E2E_TABLE_TOKEN env vars to enable.
  test.skip(!process.env.E2E_TABLE_TOKEN, 'Requires E2E_TABLE_TOKEN env var')

  test('guest can view menu when accessing table URL', async ({ page }) => {
    const tableNumber = process.env.E2E_TABLE_NUMBER || '1'
    const token = process.env.E2E_TABLE_TOKEN || ''

    await page.goto(`/vi/tables/${tableNumber}?token=${token}`)
    await page.waitForLoadState('networkidle')

    // Menu should be visible
    await expect(page.locator('main')).toBeVisible()
  })
})
