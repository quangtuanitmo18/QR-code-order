import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

/**
 * ResponsiveTableContainer
 * Wraps tables to add horizontal scroll on mobile
 * Use this for tables with many columns
 *
 * @example
 * ```tsx
 * <ResponsiveTableContainer>
 *   <Table>
 *     <TableHeader>...</TableHeader>
 *     <TableBody>...</TableBody>
 *   </Table>
 * </ResponsiveTableContainer>
 * ```
 */
interface ResponsiveTableContainerProps {
  children: ReactNode
  className?: string
  /**
   * Minimum width before horizontal scroll kicks in
   * @default '600px'
   */
  minWidth?: string
}

export function ResponsiveTableContainer({
  children,
  className,
  minWidth = '600px',
}: ResponsiveTableContainerProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

/**
 * ResponsiveTableCard
 * Alternative to table layout for mobile - shows data as cards
 * Use this for smaller datasets (< 10 rows) where card layout is more readable
 *
 * @example
 * ```tsx
 * // Desktop: Show table
 * <div className="hidden md:block">
 *   <Table>...</Table>
 * </div>
 *
 * // Mobile: Show cards
 * <div className="block md:hidden space-y-4">
 *   {data.map(item => (
 *     <ResponsiveTableCard key={item.id}>
 *       <ResponsiveTableCardRow label="Name" value={item.name} />
 *       <ResponsiveTableCardRow label="Email" value={item.email} />
 *       <ResponsiveTableCardRow label="Status" value={item.status} />
 *     </ResponsiveTableCard>
 *   ))}
 * </div>
 * ```
 */
interface ResponsiveTableCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function ResponsiveTableCard({ children, className, onClick }: ResponsiveTableCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        onClick && 'cursor-pointer transition-colors hover:bg-accent',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveTableCardRow
 * Individual row in a card layout
 */
interface ResponsiveTableCardRowProps {
  label: string
  value: ReactNode
  className?: string
}

export function ResponsiveTableCardRow({ label, value, className }: ResponsiveTableCardRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2', className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  )
}

/**
 * ResponsiveTableCardActions
 * Action buttons row for card layout
 */
interface ResponsiveTableCardActionsProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTableCardActions({
  children,
  className,
}: ResponsiveTableCardActionsProps) {
  return <div className={cn('mt-4 flex gap-2 border-t pt-4', className)}>{children}</div>
}
