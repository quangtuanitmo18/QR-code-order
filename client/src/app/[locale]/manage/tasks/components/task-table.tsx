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
import { Card, CardContent } from '@/components/ui/card'
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
import { useDeleteTaskMutation, useGetTasksQuery } from '@/queries/useTask'
import { GetTasksQueryParamsType, TaskType } from '@/schemaValidations/task.schema'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { debounce } from 'lodash'
import {
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Clock,
  Edit,
  ListTodo,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { categories, priorities, statuses } from '../data/constants'

interface TaskTableProps {
  onNewTask: () => void
  onEditTask: (task: TaskType) => void
  onViewTask?: (task: TaskType) => void
}

export function TaskTable({ onNewTask, onEditTask, onViewTask }: TaskTableProps) {
  // Server-side state
  const [filters, setFilters] = useState<GetTasksQueryParamsType>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')
  const [deletingTask, setDeletingTask] = useState<TaskType | null>(null)

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev) => ({
          ...prev,
          search: value || undefined,
          page: 1, // Reset to page 1 when search changes
        }))
      }, 500),
    []
  )

  // Update search when input changes
  useEffect(() => {
    debouncedSearch(searchInput)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchInput, debouncedSearch])

  // Fetch tasks with server-side operations
  const { data, isLoading } = useGetTasksQuery(filters)
  const deleteMutation = useDeleteTaskMutation()

  const tasks = data?.payload.data.tasks || []
  const pagination = data?.payload.data.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  }
  const statistics = data?.payload.data.statistics || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  }

  // Handler functions
  const handleFilterChange = useCallback(
    (key: keyof GetTasksQueryParamsType, value: string | number | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === 'all' || value === '' ? undefined : value,
        page: 1, // Reset to page 1 when filter changes
      }))
    },
    []
  )

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as GetTasksQueryParamsType['sortBy'],
      sortOrder,
      page: 1, // Reset to page 1 when sort changes
    }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }))
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deletingTask) return

    try {
      await deleteMutation.mutateAsync(deletingTask.id)
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      })
      setDeletingTask(null)
    } catch (error) {
      handleErrorApi({
        error,
      })
    }
  }, [deletingTask, deleteMutation])

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{statistics.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {statistics.total > 0
                        ? Math.round((statistics.completed / statistics.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <ListTodo className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{statistics.completed}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {statistics.total > 0
                        ? Math.round((statistics.completed / statistics.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <CheckCircle2 className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{statistics.inProgress}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {statistics.total > 0
                        ? Math.round((statistics.inProgress / statistics.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <Clock className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{statistics.pending}</span>
                    <span className="flex items-center gap-0.5 text-sm text-orange-500">
                      <ArrowUp className="size-3.5" />
                      {statistics.total > 0
                        ? Math.round((statistics.pending / statistics.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <BarChart3 className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search Input */}
              <Input
                placeholder="Search by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full sm:max-w-sm"
              />

              {/* Status Filter */}
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New Task Button */}
            <div className="sm:ml-auto">
              <Button onClick={onNewTask}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statuses.find((s) => s.value === task.status)?.label || task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categories.find((c) => c.value === task.category)?.label || task.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {priorities.find((p) => p.value === task.priority)?.label || task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.assignedTo ? task.assignedTo.name : 'Unassigned'}</TableCell>
                    <TableCell>
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>{format(new Date(task.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <DotsHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onViewTask && (
                            <DropdownMenuItem onClick={() => onViewTask(task)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onEditTask(task)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingTask(task)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:py-4">
            <div className="text-center text-xs text-muted-foreground sm:flex-1 sm:text-left">
              Showing <strong>{tasks.length}</strong> of <strong>{pagination.total}</strong> results
            </div>
            <div className="flex justify-center">
              <AutoPagination
                page={pagination.page}
                pageSize={pagination.totalPages}
                isLink={false}
                onClick={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingTask?.title}&quot;? This action cannot
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
