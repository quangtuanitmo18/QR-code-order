import React from 'react'
import { vi } from 'vitest'

// Minimal stub for next-intl (and all next-intl/* subpaths) to prevent ESM resolution errors in Vitest
// (next-intl imports next/navigation which fails in Vitest's happy-dom)

// next-intl/routing exports
export const defineRouting = (config: Record<string, unknown>) => config

// next-intl/navigation exports
export const createNavigation = (_routing: unknown) => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  redirect: vi.fn(),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  getPathname: vi.fn(),
})

// next-intl base exports
export const NextIntlClientProvider = ({ children }: { children: React.ReactNode }) => children
export const useTranslations = () => (key: string) => key
export const useLocale = () => 'vi'
export const useMessages = () => ({})
export const useFormatter = () => ({
  dateTime: (v: unknown) => String(v),
  number: (v: unknown) => String(v),
  list: (v: unknown[]) => v.join(', '),
})
export const useNow = () => new Date()
export const useTimeZone = () => 'UTC'

// next-intl/server exports
export const getTranslations = vi.fn(async () => (key: string) => key)
export const getLocale = vi.fn(async () => 'vi')
