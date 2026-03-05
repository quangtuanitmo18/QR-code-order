import React from 'react'
import { vi } from 'vitest'

// Stub for src/i18n/routing.ts
// Avoids importing next-intl/routing and next-intl/navigation in tests
export const routing = {
  locales: ['en', 'vi', 'ru'],
  defaultLocale: 'en',
}

export const Link = ({ children }: { children: React.ReactNode }) => children
export const redirect = vi.fn()
export const usePathname = () => '/'
export const useRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
})
