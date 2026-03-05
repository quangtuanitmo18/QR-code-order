import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn().mockImplementation(({ src, alt }: { src: string; alt: string }) => {
    return { type: 'img', props: { src, alt } }
  }),
}))

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' }),
  Roboto: () => ({ className: 'roboto' }),
}))

// NOTE: next-intl is handled via resolve.alias in vitest.config.ts — do NOT add vi.mock('next-intl') here
// as it would conflict by intercepting next-intl/* subpath imports before alias resolution.

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    connected: false,
  })),
}))
