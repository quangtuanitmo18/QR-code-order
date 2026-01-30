'use client'

import { useGetEventDatesWithCountsQuery, useGetEventsQuery } from '@/queries/useCalendar'
import { CalendarEventType } from '@/schemaValidations/calendar.schema'
import { endOfMonth, startOfMonth } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'

export interface UseCalendarState {
  selectedDate: Date
  showEventForm: boolean
  editingEvent: CalendarEventType | null
  showCalendarSheet: boolean
  events: CalendarEventType[]
  eventDates: Array<{ date: Date; count: number }>
}

export interface UseCalendarActions {
  setSelectedDate: (date: Date) => void
  setShowEventForm: (show: boolean) => void
  setEditingEvent: (event: CalendarEventType | null) => void
  setShowCalendarSheet: (show: boolean) => void
  handleDateSelect: (date: Date) => void
  handleNewEvent: () => void
  handleNewCalendar: () => void
  handleSaveEvent: () => void
  handleDeleteEvent: () => void
  handleEditEvent: (event: CalendarEventType) => void
  refetchEvents: () => void
}

export interface UseCalendarReturn extends UseCalendarState, UseCalendarActions {}

export function useCalendar(): UseCalendarReturn {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEventType | null>(null)
  const [showCalendarSheet, setShowCalendarSheet] = useState(false)

  // Calculate date range for current month
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  // Fetch events for current month
  const eventsQuery = useGetEventsQuery({
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
  })

  // Fetch event dates with counts for calendar picker
  const eventDatesQuery = useGetEventDatesWithCountsQuery({
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
  })

  const events = eventsQuery.data?.payload.data || []
  const eventDates =
    eventDatesQuery.data?.payload.data.map((item: { date: string; count: number }) => ({
      date: new Date(item.date),
      count: item.count,
    })) || []

  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date)
      // Auto-close mobile sheet when date is selected
      setShowCalendarSheet(false)
    },
    [setShowCalendarSheet]
  )

  const handleNewEvent = useCallback(() => {
    setEditingEvent(null)
    setShowEventForm(true)
  }, [])

  const handleNewCalendar = useCallback(() => {
    console.log('Creating new calendar')
    // In a real app, this would open a new calendar form
  }, [])

  const handleSaveEvent = useCallback(() => {
    setShowEventForm(false)
    setEditingEvent(null)
    // Refetch events after save
    eventsQuery.refetch()
    eventDatesQuery.refetch()
  }, [eventsQuery, eventDatesQuery])

  const handleDeleteEvent = useCallback(() => {
    setShowEventForm(false)
    setEditingEvent(null)
    // Refetch events after delete
    eventsQuery.refetch()
    eventDatesQuery.refetch()
  }, [eventsQuery, eventDatesQuery])

  const handleEditEvent = useCallback((event: CalendarEventType) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }, [])

  const refetchEvents = useCallback(() => {
    eventsQuery.refetch()
    eventDatesQuery.refetch()
  }, [eventsQuery, eventDatesQuery])

  // Refetch when selectedDate changes (month changes)
  useEffect(() => {
    eventsQuery.refetch()
    eventDatesQuery.refetch()
  }, [selectedDate, eventsQuery, eventDatesQuery])

  return {
    // State
    selectedDate,
    showEventForm,
    editingEvent,
    showCalendarSheet,
    events,
    eventDates,
    // Actions
    setSelectedDate,
    setShowEventForm,
    setEditingEvent,
    setShowCalendarSheet,
    handleDateSelect,
    handleNewEvent,
    handleNewCalendar,
    handleSaveEvent,
    handleDeleteEvent,
    handleEditEvent,
    refetchEvents,
  }
}
