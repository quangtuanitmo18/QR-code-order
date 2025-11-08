'use client'
import { useEffect, useState } from 'react'

/**
 * Hook to match CSS media queries in React components
 *
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean - true if query matches, false otherwise
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isLandscape = useMediaQuery('(orientation: landscape)')
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create listener for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      // Fallback for older browsers
      media.addListener(listener)
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        media.removeListener(listener)
      }
    }
  }, [query])

  // Return false during SSR and initial mount to avoid hydration mismatch
  return mounted ? matches : false
}

/**
 * Predefined media query hooks for common breakpoints
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsLargeScreen() {
  return useMediaQuery('(min-width: 1920px)')
}
