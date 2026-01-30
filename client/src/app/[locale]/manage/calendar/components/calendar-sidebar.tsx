'use client'

import { Plus } from 'lucide-react'

import { Calendars } from './calendars'
import { DatePicker } from './date-picker'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { CalendarTypeType } from '@/schemaValidations/calendar-type.schema'

interface CalendarSidebarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onNewCalendar?: () => void
  onNewEvent?: () => void
  onCalendarEdit?: (calendarType: CalendarTypeType) => void
  onCalendarDelete?: (calendarType: CalendarTypeType) => void
  onCalendarToggle?: (calendarId: number, visible: boolean) => void
  events?: Array<{ date: Date; count: number }>
  className?: string
  canCreateEvent?: boolean
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  onNewCalendar,
  onNewEvent,
  onCalendarEdit,
  onCalendarDelete,
  onCalendarToggle,
  events = [],
  className,
  canCreateEvent = false,
}: CalendarSidebarProps) {
  return (
    <div className={`flex h-full flex-col rounded-lg bg-background ${className}`}>
      {/* Add New Event Button */}
      {canCreateEvent && (
        <div className="border-b p-6">
          <Button className="w-full cursor-pointer" onClick={onNewEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Event
          </Button>
        </div>
      )}

      {/* Date Picker */}
      <DatePicker selectedDate={selectedDate} onDateSelect={onDateSelect} events={events} />

      <Separator />

      {/* Calendars */}
      <div className="flex-1 p-4">
        <Calendars
          onNewCalendar={onNewCalendar}
          onCalendarToggle={onCalendarToggle}
          onCalendarEdit={onCalendarEdit}
          onCalendarDelete={onCalendarDelete}
        />
      </div>

      {/* Footer */}
      {canCreateEvent && (
        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full cursor-pointer justify-start"
            onClick={onNewCalendar}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Calendar
          </Button>
        </div>
      )}
    </div>
  )
}
