'use client'

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid3X3,
  List,
  MapPin,
  Menu,
  Search,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CalendarEventType } from '@/schemaValidations/calendar.schema'
import { CalendarNotifications } from './notifications'

interface CalendarMainProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onMenuClick?: () => void
  events?: CalendarEventType[]
  onEventClick?: (event: CalendarEventType) => void
  canCreateEvent?: boolean
}

export function CalendarMain({
  selectedDate,
  onDateSelect,
  onMenuClick,
  events = [],
  onEventClick,
  canCreateEvent = false,
}: CalendarMainProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Extend to show full weeks (including previous/next month days)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())

  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      const eventDate = event.occurrenceDate ? new Date(event.occurrenceDate) : eventStart
      return isSameDay(eventDate, date)
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
    setCurrentDate(newDate)
    onDateSelect?.(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateSelect?.(today)
  }

  const handleEventClick = (event: CalendarEventType) => {
    if (onEventClick) {
      onEventClick(event)
    } else {
      setSelectedEvent(event)
      setShowEventDialog(true)
    }
  }

  const renderCalendarGrid = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="flex-1 bg-background">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-r p-4 text-center text-sm font-medium text-muted-foreground last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="grid flex-1 grid-cols-7">
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[120px] cursor-pointer border-b border-r p-2 transition-colors last:border-r-0',
                  isCurrentMonth
                    ? 'bg-background hover:bg-accent/50'
                    : 'bg-muted/30 text-muted-foreground',
                  isSelected && 'ring-2 ring-inset ring-primary',
                  isDayToday && 'bg-accent/20'
                )}
                onClick={() => onDateSelect?.(day)}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isDayToday &&
                        'flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{dayEvents.length - 2}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    const eventStart = new Date(event.startDate)
                    const timeStr = format(eventStart, 'h:mm a')
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'cursor-pointer truncate rounded-sm p-1 text-xs text-white',
                          event.color || 'bg-blue-500'
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{event.title}</span>
                        </div>
                        <div className="text-[10px] opacity-90">{timeStr}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const upcomingEvents = events
      .filter((event) => {
        const eventStart = new Date(event.startDate)
        return eventStart >= new Date()
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    return (
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {upcomingEvents.map((event) => {
            const eventStart = new Date(event.startDate)
            const eventEnd = new Date(event.endDate)
            return (
              <Card
                key={event.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleEventClick(event)}
              >
                <CardContent className="px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn('mt-1.5 h-3 w-3 rounded-full', event.color || 'bg-blue-500')}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(eventStart, 'MMM d, yyyy')}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(eventStart, 'h:mm a')} - {format(eventEnd, 'h:mm a')}
                          </div>
                          {event.location && (
                            <div className="flex flex-wrap items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.assignments && event.assignments.length > 0 && (
                        <div className="flex -space-x-2">
                          {event.assignments.slice(0, 3).map((assignment, index) => (
                            <Avatar key={index} className="border-2 border-background">
                              <AvatarFallback className="text-xs">
                                {assignment.employee.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}
                      <Badge variant="secondary" className={cn('text-white', event.color)}>
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col flex-wrap gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer xl:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <CalendarNotifications />

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="cursor-pointer">
              Today
            </Button>
          </div>

          <h1 className="text-2xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input placeholder="Search events..." className="w-64 pl-10" />
          </div>

          {/* View Mode Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                {viewMode === 'month' && <Grid3X3 className="mr-2 h-4 w-4" />}
                {viewMode === 'list' && <List className="mr-2 h-4 w-4" />}
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode('month')} className="cursor-pointer">
                <Grid3X3 className="mr-2 h-4 w-4" />
                Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('list')} className="cursor-pointer">
                <List className="mr-2 h-4 w-4" />
                List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'month' ? renderCalendarGrid() : renderListView()}

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title || 'Event Details'}</DialogTitle>
            <DialogDescription>View calendar event details</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(selectedEvent.startDate), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(selectedEvent.startDate), 'h:mm a')} -{' '}
                  {format(new Date(selectedEvent.endDate), 'h:mm a')}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.assignments && selectedEvent.assignments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span>Assigned to:</span>
                    <div className="flex -space-x-2">
                      {selectedEvent.assignments.map((assignment, index) => (
                        <Avatar key={index} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">
                            {assignment.employee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn('text-white', selectedEvent.color)}>
                  {selectedEvent.type}
                </Badge>
              </div>
              {selectedEvent.description && (
                <div className="border-t pt-2">
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              {canCreateEvent && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      setShowEventDialog(false)
                      onEventClick?.(selectedEvent)
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
