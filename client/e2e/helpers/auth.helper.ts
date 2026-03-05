import { Page } from '@playwright/test'

// Credentials match server .env: INITIAL_EMAIL_OWNER / INITIAL_PASSWORD_OWNER
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@order.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '123456'

/**
 * Reusable login helper for Playwright E2E tests.
 * Use this to authenticate before testing pages that require login.
 *
 * @example
 * test('admin can see dashboard', async ({ page }) => {
 *   await loginAsAdmin(page)
 *   await page.goto('/vi/manage/dashboard')
 * })
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/vi/manage/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Mật khẩu').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  // Wait for successful redirect
  await page.waitForURL(/\/manage\/dashboard|\/manage\/orders/, { timeout: 10000 })
}

/**
 * Login as guest via table token URL
 */
export async function loginAsGuest(
  page: Page,
  { tableNumber, token }: { tableNumber: number; token: string }
) {
  await page.goto(`/vi/tables/${tableNumber}?token=${token}`)
  await page.waitForLoadState('networkidle')
}
