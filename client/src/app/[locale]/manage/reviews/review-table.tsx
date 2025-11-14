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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import {
  useAdminDeleteReviewMutation,
  useAdminReplyToReviewMutation,
  useAdminReviewListQuery,
  useAdminUpdateReviewStatusMutation,
} from '@/queries/useReview'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Star } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type ReviewItem = {
  id: number
  guestId: number
  overallRating: number
  foodQuality: number
  serviceQuality: number
  ambiance: number
  priceValue: number
  comment: string
  images: string | null
  status: 'HIDDEN' | 'VISIBLE' | 'DELETED'
  createdAt: string | Date
  replyContent: string | null
  guest?: {
    id: number
    name: string
  }
}

const ReviewTableContext = createContext<{
  reviewForReply: ReviewItem | null
  setReviewForReply: (value: ReviewItem | null) => void
  reviewForDelete: ReviewItem | null
  setReviewForDelete: (value: ReviewItem | null) => void
}>({
  reviewForReply: null,
  setReviewForReply: () => {},
  reviewForDelete: null,
  setReviewForDelete: () => {},
})

export const columns: ColumnDef<ReviewItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div className="w-12">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'guest',
    header: 'Guest',
    cell: ({ row }) => {
      const guest = row.original.guest
      return <div className="font-medium">{guest?.name || 'Unknown'}</div>
    },
  },
  {
    accessorKey: 'overallRating',
    header: 'Rating',
    cell: ({ row }) => {
      const rating = row.getValue('overallRating') as number
      return (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{rating}/5</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'comment',
    header: 'Comment',
    cell: ({ row }) => {
      const comment = row.getValue('comment') as string
      return (
        <div className="max-w-md truncate text-sm" title={comment}>
          {comment}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variant =
        status === 'VISIBLE' ? 'default' : status === 'HIDDEN' ? 'secondary' : 'destructive'
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      return <div className="text-sm">{format(new Date(date), 'MMM dd, yyyy')}</div>
    },
  },
  {
    accessorKey: 'replyContent',
    header: 'Reply',
    cell: ({ row }) => {
      const hasReply = row.getValue('replyContent')
      return hasReply ? (
        <Badge variant="outline">Replied</Badge>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setReviewForReply, setReviewForDelete } = useContext(ReviewTableContext)
      const updateStatusMutation = useAdminUpdateReviewStatusMutation()

      const handleApprove = async () => {
        try {
          await updateStatusMutation.mutateAsync({
            id: row.original.id,
            body: { status: 'VISIBLE' },
          })
          toast({ title: 'Success', description: 'Review approved successfully' })
        } catch (error: any) {
          handleErrorApi({ error })
        }
      }

      const handleHide = async () => {
        try {
          await updateStatusMutation.mutateAsync({
            id: row.original.id,
            body: { status: 'HIDDEN' },
          })
          toast({ title: 'Success', description: 'Review hidden successfully' })
        } catch (error: any) {
          handleErrorApi({ error })
        }
      }

      return (
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
            {row.original.status !== 'VISIBLE' && (
              <DropdownMenuItem onClick={handleApprove}>Approve</DropdownMenuItem>
            )}
            {row.original.status === 'VISIBLE' && (
              <DropdownMenuItem onClick={handleHide}>Hide</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setReviewForReply(row.original)}>
              {row.original.replyContent ? 'Edit Reply' : 'Reply'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setReviewForDelete(row.original)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function ReplyDialog({ review, onClose }: { review: ReviewItem | null; onClose: () => void }) {
  const [replyContent, setReplyContent] = useState('')
  const replyMutation = useAdminReplyToReviewMutation()

  useEffect(() => {
    if (review?.replyContent) {
      setReplyContent(review.replyContent)
    } else {
      setReplyContent('')
    }
  }, [review])

  const handleSubmit = async () => {
    if (!review) return
    if (replyContent.trim().length < 10) {
      toast({ description: 'Reply must be at least 10 characters' })
      return
    }

    try {
      await replyMutation.mutateAsync({
        id: review.id,
        body: { replyContent },
      })
      toast({ title: 'Success', description: 'Reply added successfully' })
      onClose()
    } catch (error: any) {
      handleErrorApi({ error })
    }
  }

  return (
    <Dialog open={!!review} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Reply to Review</DialogTitle>
          <DialogDescription>
            {review?.guest?.name}'s review ({review?.overallRating}/5 stars)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Original Comment</Label>
            <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              {review?.comment}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reply">Your Reply</Label>
            <Textarea
              id="reply"
              placeholder="Type your reply here..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {replyContent.length}/500 characters (min 10)
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={replyMutation.isPending}>
            {replyMutation.isPending ? 'Submitting...' : 'Submit Reply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AlertDialogDeleteReview({
  review,
  onClose,
}: {
  review: ReviewItem | null
  onClose: () => void
}) {
  const deleteMutation = useAdminDeleteReviewMutation()

  const handleDelete = async () => {
    if (!review) return

    try {
      await deleteMutation.mutateAsync(review.id)
      toast({ title: 'Success', description: 'Review deleted successfully' })
      onClose()
    } catch (error: any) {
      handleErrorApi({ error })
    }
  }

  return (
    <AlertDialog open={!!review} onOpenChange={() => onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Review</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this review from {review?.guest?.name}? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function ReviewTable() {
  const searchParams = useSearchParams()
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1
  const pageSize = 10

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: page - 1,
    pageSize: pageSize,
  })

  const [reviewForReply, setReviewForReply] = useState<ReviewItem | null>(null)
  const [reviewForDelete, setReviewForDelete] = useState<ReviewItem | null>(null)

  const reviewListQuery = useAdminReviewListQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  })

  const reviews = reviewListQuery.data?.payload?.data ?? []
  const totalPages = reviewListQuery.data?.payload?.pagination?.totalPages ?? 0

  const table = useReactTable({
    data: reviews,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  useEffect(() => {
    setPagination({
      pageIndex: page - 1,
      pageSize: pageSize,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <ReviewTableContext.Provider
      value={{
        reviewForReply,
        setReviewForReply,
        reviewForDelete,
        setReviewForDelete,
      }}
    >
      <div className="w-full">
        <div className="flex items-center gap-4 py-4">
          <Input
            placeholder="Filter comments..."
            value={(table.getColumn('comment')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('comment')?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="VISIBLE">Visible</SelectItem>
              <SelectItem value="HIDDEN">Hidden</SelectItem>
              <SelectItem value="DELETED">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 py-4 text-xs text-muted-foreground">
            Showing <strong>{reviews.length}</strong> reviews
          </div>
          <AutoPagination
            page={pagination.pageIndex + 1}
            pageSize={pagination.pageSize}
            pathname="/manage/reviews"
          />
        </div>
      </div>

      <ReplyDialog review={reviewForReply} onClose={() => setReviewForReply(null)} />
      <AlertDialogDeleteReview review={reviewForDelete} onClose={() => setReviewForDelete(null)} />
    </ReviewTableContext.Provider>
  )
}
