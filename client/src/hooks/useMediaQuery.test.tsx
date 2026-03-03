import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useIsDesktop, useIsMobile, useMediaQuery } from './useMediaQuery'

/**
 * Helper to mock window.matchMedia for testing.
 * jsdom doesn't implement matchMedia, so we need to mock it.
 */
function mockMatchMedia(matches: boolean) {
  const listeners: ((event: MediaQueryListEvent) => void)[] = []
  const mediaQueryList: MediaQueryList = {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn((fn) => listeners.push(fn)),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_, fn) => listeners.push(fn)),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => mediaQueryList),
  })
  return { mediaQueryList, listeners }
}

describe('useMediaQuery()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the media query match result after mount', async () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    // happy-dom runs effects synchronously, so after renderHook the hook is mounted
    await act(async () => {})
    // Value should match what matchMedia.matches returns (true)
    expect(result.current).toBe(true)
  })

  it('returns true after mount when media query matches', async () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    // After useEffect runs
    await act(async () => {})
    expect(result.current).toBe(true)
  })

  it('returns false after mount when media query does not match', async () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    await act(async () => {})
    expect(result.current).toBe(false)
  })
})

describe('useIsMobile()', () => {
  it('returns true when mobile media query matches', async () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    await act(async () => {})
    expect(result.current).toBe(true)
  })
})

describe('useIsDesktop()', () => {
  it('returns false when desktop query does not match (mobile layout)', async () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsDesktop())
    await act(async () => {})
    expect(result.current).toBe(false)
  })
})
