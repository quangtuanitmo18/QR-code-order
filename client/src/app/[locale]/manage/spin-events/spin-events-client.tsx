'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useGetSpinEventsQuery } from '@/queries/useSpinEvent'
import { SpinEventTable } from './components/spin-event-table'
import { SpinEventForm } from './components/spin-event-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SpinEventType } from '@/schemaValidations/spin-event.schema'

export default function SpinEventsClient() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SpinEventType | null>(null)
  const { data, isLoading } = useGetSpinEventsQuery()

  const handleNewEvent = () => {
    setEditingEvent(null)
    setIsFormOpen(true)
  }

  const handleEditEvent = (event: SpinEventType) => {
    setEditingEvent(event)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingEvent(null)
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <Button onClick={handleNewEvent}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <SpinEventTable
        events={data?.payload.data || []}
        isLoading={isLoading}
        onEdit={handleEditEvent}
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
