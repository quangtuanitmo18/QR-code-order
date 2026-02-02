'use client'

import { SpinEventType } from '@/schemaValidations/spin-event.schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  useDeleteSpinEventMutation,
  useToggleSpinEventActiveMutation,
} from '@/queries/useSpinEvent'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
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
import { useState } from 'react'

interface SpinEventTableProps {
  events: SpinEventType[]
  isLoading?: boolean
  onEdit: (event: SpinEventType) => void
}

export function SpinEventTable({ events, isLoading = false, onEdit }: SpinEventTableProps) {
  const [deletingEvent, setDeletingEvent] = useState<SpinEventType | null>(null)
  const deleteMutation = useDeleteSpinEventMutation()
  const toggleMutation = useToggleSpinEventActiveMutation()

  const handleDelete = async () => {
    if (!deletingEvent) return

    try {
      await deleteMutation.mutateAsync(deletingEvent.id)
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      })
      setDeletingEvent(null)
    } catch (error) {
      handleErrorApi(error)
    }
  }

  const handleToggleActive = async (event: SpinEventType) => {
    try {
      await toggleMutation.mutateAsync(event.id)
      toast({
        title: 'Success',
        description: `Event ${event.isActive ? 'deactivated' : 'activated'} successfully`,
      })
    } catch (error) {
      handleErrorApi(error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No events found. Create your first event to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rewards</TableHead>
              <TableHead>Spins</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{event.description || '-'}</TableCell>
                <TableCell>{format(new Date(event.startDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  {event.endDate ? format(new Date(event.endDate), 'MMM dd, yyyy') : 'No end date'}
                </TableCell>
                <TableCell>
                  <Badge variant={event.isActive ? 'default' : 'secondary'}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{event._count?.rewards || 0}</TableCell>
                <TableCell>{event._count?.spins || 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(event)}
                      disabled={toggleMutation.isPending}
                    >
                      {event.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingEvent(event)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingEvent?.name}&quot;? This action cannot
              be undone.
              {deletingEvent && (deletingEvent._count?.rewards || 0) > 0 && (
                <span className="mt-2 block text-destructive">
                  Warning: This event has {deletingEvent._count?.rewards} reward(s) associated with
                  it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
