'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGetSpinEventByIdQuery, useGetSpinEventsQuery } from '@/queries/useSpinEvent'
import { SpinEventType } from '@/schemaValidations/spin-event.schema'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { SpinEventForm } from './components/spin-event-form'
import { SpinEventTable } from './components/spin-event-table'

export default function SpinEventsClient() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const { data, isLoading } = useGetSpinEventsQuery()

  // Fetch full event data when editing (includes spins array)
  const { data: eventData } = useGetSpinEventByIdQuery({
    id: editingEventId || 0,
    enabled: editingEventId !== null && isFormOpen,
  })

  const editingEvent = eventData?.payload.data || null

  const handleNewEvent = () => {
    setEditingEventId(null)
    setIsFormOpen(true)
  }

  const handleEditEvent = (event: SpinEventType) => {
    setEditingEventId(event.id)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingEventId(null)
  }

  return (
    <>
      <SpinEventTable
        events={data?.payload.data || []}
        isLoading={isLoading}
        onEdit={handleEditEvent}
        onNewEvent={handleNewEvent}
      />

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent
                ? 'Update the spin event details'
                : 'Create a new spin event to organize rewards'}
            </DialogDescription>
          </DialogHeader>
          <SpinEventForm
            event={editingEvent}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
