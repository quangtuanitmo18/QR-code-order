import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  /**
   * Maximum width constraint
   * @default 'full' - no max width
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /**
   * Responsive padding
   * @default true
   */
  padding?: boolean
  /**
   * Center horizontally
   * @default false
   */
  center?: boolean
}

/**
 * ResponsiveContainer component
 * A flexible container with responsive padding and max-width options
 *
 * @example
 * ```tsx
 * <ResponsiveContainer maxWidth="xl" padding center>
 *   <YourContent />
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'full',
  padding = true,
  center = false,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'w-full',
  }

  return (
    <div
      className={cn(
        maxWidth !== 'full' && maxWidthClasses[maxWidth],
        padding && 'px-4 sm:px-6 md:px-8',
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveGrid component
 * Auto-responsive grid that adjusts columns based on breakpoint
 *
 * @example
 * ```tsx
 * <ResponsiveGrid columns={{ mobile: 1, md: 2, lg: 3, xl: 4 }}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </ResponsiveGrid>
 * ```
 */
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  columns?: {
    mobile?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveGrid({
  children,
  className,
  columns = { mobile: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
}: ResponsiveGridProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-10',
  }

  const columnClasses: string[] = []

  if (columns.mobile) columnClasses.push(`grid-cols-${columns.mobile}`)
  if (columns.sm) columnClasses.push(`sm:grid-cols-${columns.sm}`)
  if (columns.md) columnClasses.push(`md:grid-cols-${columns.md}`)
  if (columns.lg) columnClasses.push(`lg:grid-cols-${columns.lg}`)
  if (columns.xl) columnClasses.push(`xl:grid-cols-${columns.xl}`)
  if (columns['2xl']) columnClasses.push(`2xl:grid-cols-${columns['2xl']}`)

  return <div className={cn('grid', ...columnClasses, gapClasses[gap], className)}>{children}</div>
}

/**
 * ResponsiveStack component
 * Stacks children vertically on mobile, horizontally on larger screens
 *
 * @example
 * ```tsx
 * <ResponsiveStack breakpoint="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </ResponsiveStack>
 * ```
 */
interface ResponsiveStackProps {
  children: ReactNode
  className?: string
  /**
   * Breakpoint where layout switches from vertical to horizontal
   * @default 'md'
   */
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Gap between items
   * @default 'md'
   */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Reverse order on larger screens
   * @default false
   */
  reverse?: boolean
}

export function ResponsiveStack({
  children,
  className,
  breakpoint = 'md',
  gap = 'md',
  reverse = false,
}: ResponsiveStackProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  const breakpointClass = reverse
    ? `flex-col-reverse ${breakpoint}:flex-row-reverse`
    : `flex-col ${breakpoint}:flex-row`

  return <div className={cn('flex', breakpointClass, gapClasses[gap], className)}>{children}</div>
}
