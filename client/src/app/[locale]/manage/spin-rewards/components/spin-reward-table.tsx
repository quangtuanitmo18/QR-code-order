'use client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useGetSpinEventsQuery } from '@/queries/useSpinEvent'
import { useDeleteSpinRewardMutation } from '@/queries/useSpinReward'
import { SpinRewardType } from '@/schemaValidations/spin-reward.schema'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const PAGE_SIZE = 10

interface SpinRewardTableProps {
  rewards: SpinRewardType[]
  isLoading?: boolean
  onEdit: (reward: SpinRewardType) => void
  onNewReward?: () => void
}

export function SpinRewardTable({
  rewards,
  isLoading = false,
  onEdit,
  onNewReward,
}: SpinRewardTableProps) {
  const [deletingReward, setDeletingReward] = useState<SpinRewardType | null>(null)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const deleteMutation = useDeleteSpinRewardMutation()
  const { data: eventsData } = useGetSpinEventsQuery()
  const events = eventsData?.payload.data || []

  // Filter rewards by event
  const filteredRewards = useMemo(() => {
    if (selectedEventId === 'all') return rewards
    const eventId = parseInt(selectedEventId, 10)
    return rewards.filter((reward) => reward.event?.id === eventId)
  }, [rewards, selectedEventId])

  // Handler functions
  const handleDelete = useCallback(async () => {
    if (!deletingReward) return

    try {
      await deleteMutation.mutateAsync(deletingReward.id)
      toast({
        title: 'Success',
        description: 'Reward deleted successfully',
      })
      setDeletingReward(null)
    } catch (error) {
      handleErrorApi({ error: error as any })
    }
  }, [deletingReward, deleteMutation])

  // Define columns
  const columns = useMemo<ColumnDef<SpinRewardType>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: row.original.color || '#3b82f6' }}
            />
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: 'event.name',
        header: 'Event',
        cell: ({ row }) =>
          row.original.event ? (
            <Badge variant="outline">{row.original.event.name}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
      },
      {
        accessorKey: 'probability',
        header: 'Probability',
        cell: ({ row }) => `${(row.original.probability * 100).toFixed(1)}%`,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) =>
          row.original.maxQuantity
            ? `${row.original.currentQuantity}/${row.original.maxQuantity}`
            : 'Unlimited',
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        accessorKey: 'order',
        header: 'Order',
        cell: ({ row }) => row.original.order,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const reward = row.original
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
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(reward)}>
                    <span className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeletingReward(reward)}
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [onEdit]
  )

  // Setup React Table
  const table = useReactTable({
    data: filteredRewards,
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

  if (rewards.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No rewards found. Create your first reward to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full space-y-3 sm:space-y-4">
        {/* Search, Event Filter, and New Reward Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:py-4">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onNewReward && (
            <div className="sm:ml-auto">
              <Button onClick={onNewReward}>
                <Plus className="mr-2 h-4 w-4" />
                New Reward
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
            <strong>{filteredRewards.length}</strong> results
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

      <AlertDialog open={!!deletingReward} onOpenChange={() => setDeletingReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingReward?.name}&quot;? This action cannot
              be undone.
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
