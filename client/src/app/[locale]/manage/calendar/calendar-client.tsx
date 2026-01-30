'use client'

import { useState } from 'react'
import { CalendarSidebar } from './components/calendar-sidebar'
import { CalendarMain } from './components/calendar-main'
import { EventForm } from './components/event-form'
import { CalendarTypeForm } from './components/calendar-type-form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCalendar } from './use-calendar'
import { useAppStore } from '@/components/app-provider'
import { CalendarTypeType } from '@/schemaValidations/calendar-type.schema'
import { useDeleteCalendarTypeMutation } from '@/queries/useCalendarType'
import { handleErrorApi } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

export default function CalendarClient() {
  const role = useAppStore((state) => state.role)
  const calendar = useCalendar()
  const [editingCalendarType, setEditingCalendarType] = useState<CalendarTypeType | null>(null)
  const [showCalendarTypeForm, setShowCalendarTypeForm] = useState(false)
  const [deletingCalendarType, setDeletingCalendarType] = useState<CalendarTypeType | null>(null)
  const deleteMutation = useDeleteCalendarTypeMutation()

  const handleNewCalendar = () => {
    setEditingCalendarType(null)
    setShowCalendarTypeForm(true)
  }

  const handleEditCalendar = (calendarType: CalendarTypeType) => {
    setEditingCalendarType(calendarType)
    setShowCalendarTypeForm(true)
  }

  const handleDeleteCalendar = (calendarType: CalendarTypeType) => {
    setDeletingCalendarType(calendarType)
  }

  const confirmDelete = async () => {
    if (!deletingCalendarType) return

    try {
      await deleteMutation.mutateAsync(deletingCalendarType.id)
      toast({
        title: 'Success',
        description: 'Calendar type deleted successfully',
      })
      setDeletingCalendarType(null)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handleCalendarToggle = (calendarId: number, visible: boolean) => {
    // Visibility is handled by the mutation in Calendars component
    // This is just for any additional side effects if needed
  }

  return (
    <>
      <div className="relative rounded-lg border bg-background">
        <div className="flex min-h-[800px]">
          {/* Desktop Sidebar - Hidden on mobile/tablet, shown on extra large screens */}
          <div className="hidden w-80 flex-shrink-0 border-r xl:block">
            <CalendarSidebar
              selectedDate={calendar.selectedDate}
              onDateSelect={calendar.handleDateSelect}
              onNewCalendar={handleNewCalendar}
              onNewEvent={calendar.handleNewEvent}
              onCalendarEdit={handleEditCalendar}
              onCalendarDelete={handleDeleteCalendar}
              onCalendarToggle={handleCalendarToggle}
              events={calendar.eventDates}
              className="h-full"
              canCreateEvent={role === 'Owner'}
            />
          </div>

          {/* Main Calendar Panel */}
          <div className="min-w-0 flex-1">
            <CalendarMain
              selectedDate={calendar.selectedDate}
              onDateSelect={calendar.handleDateSelect}
              onMenuClick={() => calendar.setShowCalendarSheet(true)}
              events={calendar.events}
              onEventClick={calendar.handleEditEvent}
              canCreateEvent={role === 'Owner'}
            />
          </div>
        </div>

        {/* Mobile/Tablet Sheet - Positioned relative to calendar container */}
        <Sheet open={calendar.showCalendarSheet} onOpenChange={calendar.setShowCalendarSheet}>
          <SheetContent side="left" className="w-80 p-0" style={{ position: 'absolute' }}>
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>Calendar</SheetTitle>
              <SheetDescription>Browse dates and manage your calendar events</SheetDescription>
            </SheetHeader>
            <CalendarSidebar
              selectedDate={calendar.selectedDate}
              onDateSelect={calendar.handleDateSelect}
              onNewCalendar={handleNewCalendar}
              onNewEvent={calendar.handleNewEvent}
              onCalendarEdit={handleEditCalendar}
              onCalendarDelete={handleDeleteCalendar}
              onCalendarToggle={handleCalendarToggle}
              events={calendar.eventDates}
              className="h-full"
              canCreateEvent={role === 'Owner'}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Event Form Dialog */}
      {role === 'Owner' && (
        <EventForm
          event={calendar.editingEvent}
          open={calendar.showEventForm}
          onOpenChange={calendar.setShowEventForm}
          onSave={calendar.handleSaveEvent}
          onDelete={calendar.handleDeleteEvent}
        />
      )}

      {/* Calendar Type Form Dialog */}
      {role === 'Owner' && (
        <CalendarTypeForm
          calendarType={editingCalendarType}
          open={showCalendarTypeForm}
          onOpenChange={setShowCalendarTypeForm}
          onSuccess={() => {
            setEditingCalendarType(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCalendarType}
        onOpenChange={(open) => !open && setDeletingCalendarType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calendar Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingCalendarType?.label}&quot;? This action
              cannot be undone.
              {deletingCalendarType && ' Events using this type will need to be reassigned.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
