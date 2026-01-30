'use client'

import { useMemo } from 'react'
import { Check, ChevronRight, Plus, Eye, EyeOff, MoreHorizontal } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  useGetCalendarTypesQuery,
  useToggleCalendarTypeVisibilityMutation,
} from '@/queries/useCalendarType'
import { CalendarTypeType } from '@/schemaValidations/calendar-type.schema'
import { useAppStore } from '@/components/app-provider'

interface CalendarsProps {
  onCalendarToggle?: (calendarId: number, visible: boolean) => void
  onCalendarEdit?: (calendarType: CalendarTypeType) => void
  onCalendarDelete?: (calendarType: CalendarTypeType) => void
  onNewCalendar?: () => void
}

// Group calendar types by category
function groupCalendarTypes(types: CalendarTypeType[]) {
  const groups: Record<string, CalendarTypeType[]> = {
    work: [],
    personal: [],
    shared: [],
  }

  types.forEach((type) => {
    if (groups[type.category]) {
      groups[type.category].push(type)
    }
  })

  return [
    {
      name: 'My Calendars',
      items: [...groups.work, ...groups.personal],
    },
    {
      name: 'Company Events',
      items: groups.shared,
    },
  ].filter((group) => group.items.length > 0)
}

export function Calendars({
  onCalendarToggle,
  onCalendarEdit,
  onCalendarDelete,
  onNewCalendar,
}: CalendarsProps) {
  const role = useAppStore((state) => state.role)
  const isOwner = role === 'Owner'

  const { data: calendarTypesQuery, isLoading } = useGetCalendarTypesQuery()
  const toggleVisibilityMutation = useToggleCalendarTypeVisibilityMutation()

  const calendarTypes = calendarTypesQuery?.payload.data || []
  const calendarGroups = useMemo(() => groupCalendarTypes(calendarTypes), [calendarTypes])

  const handleToggleVisibility = async (calendarType: CalendarTypeType) => {
    if (isOwner) {
      try {
        await toggleVisibilityMutation.mutateAsync(calendarType.id)
        onCalendarToggle?.(calendarType.id, !calendarType.visible)
      } catch (error) {
        console.error('Failed to toggle visibility:', error)
      }
    } else {
      // For non-owners, just toggle locally (UI only)
      onCalendarToggle?.(calendarType.id, !calendarType.visible)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-8 w-full rounded bg-muted" />
          <div className="h-8 w-full rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {calendarGroups.map((group, index) => (
        <div key={group.name}>
          <Collapsible defaultOpen={index === 0} className="group/collapsible">
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-accent hover:text-accent-foreground">
              <span className="text-sm font-medium">{group.name}</span>
              <div className="flex items-center gap-1">
                {index === 0 && isOwner && (
                  <div
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm opacity-0 hover:bg-accent group-hover/collapsible:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewCalendar?.()
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </div>
                )}
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <div key={item.id} className="group/calendar-item">
                    <div className="flex items-center justify-between rounded-md p-2 hover:bg-accent/50">
                      <div className="flex flex-1 items-center gap-3">
                        {/* Calendar Color & Visibility Toggle */}
                        <button
                          onClick={() => handleToggleVisibility(item)}
                          className={cn(
                            'flex aspect-square size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-all',
                            item.visible
                              ? cn('border-transparent text-white', item.color)
                              : 'border-border bg-transparent'
                          )}
                        >
                          {item.visible && <Check className="size-3" />}
                        </button>

                        {/* Calendar Name */}
                        <span
                          className={cn(
                            'flex-1 cursor-pointer truncate text-sm',
                            !item.visible && 'text-muted-foreground'
                          )}
                          onClick={() => handleToggleVisibility(item)}
                        >
                          {item.label}
                        </span>

                        {/* Visibility Icon */}
                        <div className="opacity-0 group-hover/calendar-item:opacity-100">
                          {item.visible ? (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>

                        {/* More Options - Only for Owner */}
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div
                                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm p-0 opacity-0 hover:bg-accent group-hover/calendar-item:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="right">
                              <DropdownMenuItem
                                onClick={() => onCalendarEdit?.(item)}
                                className="cursor-pointer"
                              >
                                Edit calendar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleVisibility(item)}
                                className="cursor-pointer"
                              >
                                {item.visible ? 'Hide' : 'Show'} calendar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onCalendarDelete?.(item)}
                                className="cursor-pointer text-destructive"
                              >
                                Delete calendar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  )
}
