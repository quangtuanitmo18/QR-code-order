'use client'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

/**
 * Breakpoint type matching Tailwind breakpoints
 */
export type Breakpoint = 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Viewport state interface
 */
export interface ViewportState {
  width: number
  height: number
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
}

const ViewportContext = createContext<ViewportState | null>(null)

/**
 * Debounce helper function
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Get breakpoint name from window width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= 1920) return '2xl'
  if (width >= 1280) return 'xl'
  if (width >= 1024) return 'lg'
  if (width >= 768) return 'md'
  if (width >= 640) return 'sm'
  return 'mobile'
}

/**
 * Get viewport state from window dimensions
 */
function getViewportState(): ViewportState {
  if (typeof window === 'undefined') {
    // SSR default: desktop
    return {
      width: 1920,
      height: 1080,
      breakpoint: 'xl',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: 'landscape',
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const breakpoint = getBreakpoint(width)

  return {
    width,
    height,
    breakpoint,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    orientation: height > width ? 'portrait' : 'landscape',
  }
}

/**
 * ViewportProvider component
 * Wrap your app with this to provide viewport state to all components
 *
 * @example
 * ```tsx
 * // In app-provider.tsx or layout.tsx
 * <ViewportProvider>
 *   {children}
 * </ViewportProvider>
 * ```
 */
export function ViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<ViewportState>(getViewportState)

  useEffect(() => {
    // Update viewport state on resize (debounced)
    const handleResize = debounce(() => {
      setViewport(getViewportState())
    }, 150)

    // Set initial state
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <ViewportContext.Provider value={viewport}>{children}</ViewportContext.Provider>
}

/**
 * Hook to access viewport state
 * Must be used within ViewportProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, breakpoint, width } = useViewport()
 *
 *   if (isMobile) {
 *     return <MobileView />
 *   }
 *
 *   return <DesktopView />
 * }
 * ```
 */
export function useViewport(): ViewportState {
  const context = useContext(ViewportContext)

  if (!context) {
    // Fallback if provider is missing (development warning)
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'useViewport must be used within ViewportProvider. Returning default desktop values.'
      )
    }

    // Return safe defaults
    return {
      width: 1920,
      height: 1080,
      breakpoint: 'xl',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: 'landscape',
    }
  }

  return context
}

/**
 * Optional: Export individual breakpoint checks as separate hooks
 */
export function useBreakpoint(): Breakpoint {
  const { breakpoint } = useViewport()
  return breakpoint
}

export function useOrientation(): 'portrait' | 'landscape' {
  const { orientation } = useViewport()
  return orientation
}
