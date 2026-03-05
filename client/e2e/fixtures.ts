import { test as base, type Page } from '@playwright/test'

/**
 * Playwright Fixtures — provides pre-authenticated pages for E2E tests.
 *
 * Test accounts (created automatically via global-setup.ts):
 * - Admin:    admin@order.com    / 123456  (auto-created when server starts)
 * - Employee: employee@order.com / 123456  (auto-created in global-setup.ts)
 *
 * @example
 * import { test, expect } from '../fixtures'
 *
 * test('admin sees dashboard', async ({ adminPage }) => {
 *   await adminPage.goto('/en/manage/dashboard')
 * })
 */

type MyFixtures = {
  /** Page logged in as Admin (Owner role) */
  adminPage: Page
  /** Page logged in as Employee */
  employeePage: Page
  /** Page for a guest user — logged in and on the menu page */
  guestPage: Page
}

export const test = base.extend<MyFixtures>({
  adminPage: async ({ page }, use) => {
    await page.goto('/en/manage/login')
    await page.getByLabel('Email').fill('admin@order.com')
    await page.getByLabel('Password').fill('123456')
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    // Wait for redirect into manage area
    await page.waitForURL(/\/manage\/(dashboard|orders|dishes)/, { timeout: 15000 })
    await use(page)
    // Teardown — clear session cookies
    await page.context().clearCookies()
  },

  employeePage: async ({ page }, use) => {
    await page.goto('/en/manage/login')
    await page.getByLabel('Email').fill('employee@order.com')
    await page.getByLabel('Password').fill('123456')
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    await page.waitForURL(/\/manage\//, { timeout: 15000 })
    await use(page)
    await page.context().clearCookies()
  },

  guestPage: async ({ page }, use) => {
    const tableNumber = process.env.E2E_TABLE_NUMBER || '1'
    const token = process.env.E2E_TABLE_TOKEN

    if (!token) {
      console.warn('[fixture] No E2E_TABLE_TOKEN — guest test may fail')
    }

    // Navigate to table URL — shows guest login form
    await page.goto(`/en/tables/${tableNumber}?token=${token}`)
    await page.waitForLoadState('domcontentloaded')

    // Fill in guest name and submit login
    const nameInput = page.locator('#name')
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('E2E Guest')
      // Click the submit/continue button
      await page.getByRole('button', { name: /continue/i }).click()
      // Wait for redirect to guest menu
      await page.waitForURL(/\/guest\/menu/, { timeout: 15000 })
    }

    await page.waitForLoadState('networkidle')
    await use(page)
  },
})

export { expect } from '@playwright/test'
