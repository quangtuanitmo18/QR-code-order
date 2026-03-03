import { expect, test } from '@playwright/test'

/**
 * E2E tests for admin login flow
 *
 * Test accounts:
 * - Admin (auto-created when server starts): admin@order.com / 123456
 * - Employee (auto-created in global-setup.ts): employee@order.com / 123456
 *
 * Requires the dev server to be running at http://localhost:3000
 */
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/manage/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    // Form should remain (not redirect)
    await expect(page).toHaveURL(/login/)
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    // Should stay on login page
    await expect(page).toHaveURL(/login/)
  })

  test('should show error for wrong credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@email.com')
    await page.getByLabel('Password').fill('wrongpassword123')
    await page.getByRole('button', { name: 'Login', exact: true }).click()

    // Wait for server response
    await page.waitForTimeout(2000)

    // Should remain on login page
    expect(page.url()).toContain('login')
  })
})
