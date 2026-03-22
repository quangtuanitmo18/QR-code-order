'use client'

import { useTranslations } from 'next-intl'
import AutoPagination from '@/components/auto-pagination'
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
import { Input } from '@/components/ui/input'
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
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Edit, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const PAGE_SIZE = 10

interface SpinEventTableProps {
  events: SpinEventType[]
  isLoading?: boolean
  onEdit: (event: SpinEventType) => void
  onNewEvent?: () => void
}

export function SpinEventTable({
  events,
  isLoading = false,
  onEdit,
  onNewEvent,
}: SpinEventTableProps) {
  const t = useTranslations('SpinEvents')
  const [deletingEvent, setDeletingEvent] = useState<SpinEventType | null>(null)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const deleteMutation = useDeleteSpinEventMutation()
  const toggleMutation = useToggleSpinEventActiveMutation()

  // Handler functions
  const handleDelete = useCallback(async () => {
    if (!deletingEvent) return

    try {
      await deleteMutation.mutateAsync(deletingEvent.id)
      toast({
        title: 'Success',
        description: t('deleteSuccess'),
      })
      setDeletingEvent(null)
    } catch (error) {
      handleErrorApi({
        error,
      })
    }
  }, [deletingEvent, deleteMutation, t])

  const handleToggleActive = useCallback(
    async (event: SpinEventType) => {
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
    },
    [toggleMutation]
  )

  // Define columns
  const columns = useMemo<ColumnDef<SpinEventType>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('name'),
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
      {
        accessorKey: 'description',
        header: t('description'),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate">{row.original.description || '-'}</div>
        ),
      },
      {
        accessorKey: 'startDate',
        header: t('startDate'),
        cell: ({ row }) => format(new Date(row.original.startDate), 'MMM dd, yyyy'),
      },
      {
        accessorKey: 'endDate',
        header: t('endDate'),
        cell: ({ row }) =>
          row.original.endDate
            ? format(new Date(row.original.endDate), 'MMM dd, yyyy')
            : t('noEndDate'),
      },
      {
        accessorKey: 'isActive',
        header: t('status'),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? t('active') : t('inactive')}
          </Badge>
        ),
      },
      {
        accessorKey: '_count.rewards',
        header: t('rewards'),
        cell: ({ row }) => row.original._count?.rewards || 0,
      },
      {
        accessorKey: '_count.spins',
        header: t('spins'),
        cell: ({ row }) => row.original._count?.spins || 0,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t('actions')}</div>,
        cell: ({ row }) => {
          const event = row.original
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <DotsHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleToggleActive(event)}
                    disabled={toggleMutation.isPending}
                  >
                    {event.isActive ? (
                      <span className="flex items-center gap-2">
                        <ToggleLeft className="h-4 w-4" />
                        {t('deactivate')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ToggleRight className="h-4 w-4" />
                        {t('activate')}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(event)}>
                    <span className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      {t('edit')}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeletingEvent(event)}
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      {t('delete')}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [onEdit, toggleMutation.isPending, handleToggleActive, t]
  )

  // Setup React Table
  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      pagination,
    },
  })

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
        <p>{t('noEventsFound')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full space-y-3 sm:space-y-4">
        {/* Search Input and New Event Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:py-4">
          <Input
            placeholder={t('filterByName')}
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="w-full sm:max-w-sm"
          />
          {onNewEvent && (
            <div className="sm:ml-auto">
              <Button onClick={onNewEvent}>
                <Plus className="mr-2 h-4 w-4" />
                {t('newEvent')}
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:py-4">
          <div className="text-center text-xs text-muted-foreground sm:flex-1 sm:text-left">
            Showing <strong>{table.getPaginationRowModel().rows.length}</strong> of{' '}
            <strong>{events.length}</strong> results
          </div>

          <div className="flex justify-center">
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              isLink={false}
              onClick={(pageNumber) => {
                table.setPageIndex(pageNumber - 1)
              }}
            />
          </div>
        </div>
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
