import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RenderOptions, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { ReactElement, ReactNode } from 'react'

// Minimal messages for tests
const testMessages = {
  // Add message keys as needed for components under test
  Error: {
    title: 'Error',
    unknown: 'Unknown error',
  },
}

// Create a fresh QueryClient for each test to avoid state pollution
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No retries in tests
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="vi" messages={testMessages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom render that wraps with all providers needed across the app.
 * Use this instead of @testing-library/react's render for component tests.
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { userEvent }

// Override render with our custom version
export { customRender as render }
