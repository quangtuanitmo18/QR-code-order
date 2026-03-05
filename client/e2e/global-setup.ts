import { request } from '@playwright/test'

/**
 * Global Setup — runs once before the entire E2E test suite.
 *
 * Tasks:
 * 1. Login with the admin account (auto-created when the server starts)
 * 2. Create the employee account if it doesn't exist
 * 3. Ensure at least one table exists (create if needed)
 * 4. Ensure at least one dish exists (create if needed)
 * 5. Fetch a table token from the API and store it in process.env for guest tests
 */
async function globalSetup() {
  const apiContext = await request.newContext({
    baseURL: 'http://localhost:4000',
  })

  // ─── 1. Login as admin ────────────────────────────────────────────────────
  const loginRes = await apiContext.post('/auth/login', {
    data: {
      email: 'admin@order.com',
      password: '123456',
    },
  })

  if (!loginRes.ok()) {
    console.error('[global-setup] ❌ Admin login failed:', loginRes.status(), await loginRes.text())
    throw new Error('Admin login failed — is the server running at http://localhost:4000?')
  }

  const {
    data: { accessToken },
  } = await loginRes.json()
  console.log('[global-setup] ✅ Admin logged in')

  // ─── 2. Create employee account (if not exists) ───────────────────────────
  const createEmployeeRes = await apiContext.post('/accounts', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: 'Employee Test',
      email: 'employee@order.com',
      password: '123456',
      confirmPassword: '123456',
      role: 'Employee',
    },
  })

  if (createEmployeeRes.ok()) {
    console.log('[global-setup] ✅ Employee account created: employee@order.com / 123456')
  } else {
    const status = createEmployeeRes.status()
    if (status === 422) {
      console.log('[global-setup] ℹ️  Employee account already exists, skipping')
    } else {
      console.warn('[global-setup] ⚠️ Could not create employee account:', status)
    }
  }

  // ─── 3. Ensure at least one table exists ──────────────────────────────────
  const tablesRes = await apiContext.get('/tables', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  let tables: any[] = []
  if (tablesRes.ok()) {
    const tablesBody = await tablesRes.json()
    tables = tablesBody.data || []
  }

  if (tables.length === 0) {
    console.log('[global-setup] ℹ️  No tables found, creating table #1...')
    const createTableRes = await apiContext.post('/tables', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        number: 1,
        capacity: 4,
        status: 'Available',
      },
    })

    if (createTableRes.ok()) {
      const { data: newTable } = await createTableRes.json()
      tables = [newTable]
      console.log('[global-setup] ✅ Table #1 created')
    } else {
      console.warn(
        '[global-setup] ⚠️  Could not create table:',
        createTableRes.status(),
        await createTableRes.text()
      )
    }
  }

  // ─── 4. Ensure at least one dish exists ───────────────────────────────────
  const dishesRes = await apiContext.get('/dishes', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  let dishes: any[] = []
  if (dishesRes.ok()) {
    const dishesBody = await dishesRes.json()
    dishes = dishesBody.data || []
  }

  if (dishes.length === 0) {
    console.log('[global-setup] ℹ️  No dishes found, creating sample dishes...')

    const sampleDishes = [
      {
        name: 'E2E Burger',
        price: 9.99,
        description: 'Test burger for E2E',
        image: 'http://localhost:4000/static/default-dish.png',
        status: 'Available',
      },
      {
        name: 'E2E Fries',
        price: 4.99,
        description: 'Test fries for E2E',
        image: 'http://localhost:4000/static/default-dish.png',
        status: 'Available',
      },
    ]

    for (const dish of sampleDishes) {
      const createDishRes = await apiContext.post('/dishes', {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: dish,
      })

      if (createDishRes.ok()) {
        console.log(`[global-setup] ✅ Dish "${dish.name}" created`)
      } else {
        console.warn(
          `[global-setup] ⚠️  Could not create dish "${dish.name}":`,
          createDishRes.status()
        )
      }
    }
  } else {
    console.log(`[global-setup] ℹ️  ${dishes.length} dish(es) already exist`)
  }

  // ─── 5. Set table token for guest tests ───────────────────────────────────
  if (tables.length > 0) {
    const firstTable = tables[0]
    process.env.E2E_TABLE_NUMBER = String(firstTable.number)
    process.env.E2E_TABLE_TOKEN = firstTable.token
    console.log(`[global-setup] ✅ Table token set for table #${firstTable.number}`)
  } else {
    console.warn('[global-setup] ⚠️  No tables available — guest E2E tests will be skipped')
  }

  await apiContext.dispose()
}

export default globalSetup
