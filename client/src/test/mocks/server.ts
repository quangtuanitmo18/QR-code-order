import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth.handler'
import { dishHandlers } from './handlers/dish.handler'

/**
 * MSW server - intercepts fetch calls at network level.
 * Use in Vitest unit/integration tests to mock API responses.
 *
 * @example
 * import { server } from '@/test/mocks/server'
 * import { http, HttpResponse } from 'msw'
 *
 * // Override specific handler in a test:
 * server.use(
 *   http.post('/auth/login', () =>
 *     HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
 *   )
 * )
 */
export const server = setupServer(...authHandlers, ...dishHandlers)

// Vitest lifecycle hooks — add to your test file or setup file:
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())
export { http, HttpResponse }
