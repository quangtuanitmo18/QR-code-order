import { expect, test } from '../fixtures'

/**
 * E2E Tests — Table Management (Admin)
 *
 * Tests the full CRUD flow for tables in the admin panel.
 * Uses adminPage fixture for pre-authenticated admin session.
 * Tests run in serial order since add → filter → delete are dependent.
 */

// Use a unique table number to avoid clashing with existing tables
const testTableNumber = 88
const testCapacity = 6

test.describe.serial('Table Management', () => {
  test('admin can see table list with columns', async ({ adminPage }) => {
    await adminPage.goto('/en/manage/tables')
    await adminPage.waitForLoadState('networkidle')

    // Verify table headers are visible
    await expect(adminPage.getByText('Table number').first()).toBeVisible()
    await expect(adminPage.getByText('Capacity').first()).toBeVisible()
    await expect(adminPage.getByText('Status').first()).toBeVisible()
  })

  test('admin can add a new table', async ({ adminPage }) => {
    await adminPage.goto('/en/manage/tables')
    await adminPage.waitForLoadState('networkidle')

    // Click "Add table" button
    await adminPage.getByRole('button', { name: /add table/i }).click()

    // Wait for dialog to appear
    await expect(adminPage.getByRole('heading', { name: 'Add table' })).toBeVisible()

    // Fill table form
    await adminPage.locator('#number').fill(String(testTableNumber))
    await adminPage.locator('#capacity').fill(String(testCapacity))

    // Submit — the button text is "Add" in the dialog footer
    await adminPage.getByRole('button', { name: /^add$/i }).click()

    // Wait for dialog to close
    await adminPage.waitForTimeout(2000)

    // Filter to find our new table
    await adminPage.getByPlaceholder('Filter table number').fill(String(testTableNumber))
    await adminPage.waitForTimeout(500)

    // Verify table appears
    await expect(adminPage.locator('table tbody tr').first()).toBeVisible()
  })

  test('admin can filter tables by number', async ({ adminPage }) => {
    await adminPage.goto('/en/manage/tables')
    await adminPage.waitForLoadState('networkidle')

    // Filter by the test table number
    await adminPage.getByPlaceholder('Filter table number').fill(String(testTableNumber))
    await adminPage.waitForTimeout(500)

    // Should find our table
    const firstRow = adminPage.locator('table tbody tr').first()
    await expect(firstRow).toBeVisible()
    await expect(firstRow.getByText(String(testTableNumber))).toBeVisible()
  })

  test('admin can delete a table', async ({ adminPage }) => {
    await adminPage.goto('/en/manage/tables')
    await adminPage.waitForLoadState('networkidle')

    // Filter to find the test table
    await adminPage.getByPlaceholder('Filter table number').fill(String(testTableNumber))
    await adminPage.waitForTimeout(500)

    // Click the 3-dots actions button (DotsHorizontalIcon) in the first row
    const row = adminPage.locator('table tbody tr').first()
    await row.locator('button').last().click()

    // Click Delete from the dropdown
    await adminPage.getByRole('menuitem', { name: /delete/i }).click()

    // Confirm deletion in the alert dialog
    await adminPage.getByRole('button', { name: /continue/i }).click()

    // Wait for delete to complete
    await adminPage.waitForTimeout(2000)

    // Verify table is gone — filter again
    await adminPage.getByPlaceholder('Filter table number').clear()
    await adminPage.getByPlaceholder('Filter table number').fill(String(testTableNumber))
    await adminPage.waitForTimeout(500)

    // Should show "No results"
    await expect(adminPage.getByText('No results').first()).toBeVisible()
  })
})
