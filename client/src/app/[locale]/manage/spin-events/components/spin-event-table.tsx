'use client'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import {
  useDeleteSpinEventMutation,
  useToggleSpinEventActiveMutation,
} from '@/queries/useSpinEvent'
import { SpinEventType } from '@/schemaValidations/spin-event.schema'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
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
      handleErrorApi({
        error,
      })
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
      handleErrorApi({
        error,
      })
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <DotsHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(event)}
                        disabled={toggleMutation.isPending}
                      >
                        {event.isActive ? (
                          <span className="flex items-center gap-2">
                            <ToggleLeft className="h-4 w-4" />
                            Deactivate
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ToggleRight className="h-4 w-4" />
                            Activate
                          </span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(event)}>
                        <span className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingEvent(event)}
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
