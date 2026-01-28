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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { Link, useRouter } from '@/i18n/routing'
import { handleErrorApi } from '@/lib/utils'
import { useArchiveBlogPostMutation, useBlogPostsManageQuery } from '@/queries/useBlog'
import { BlogPostListResType } from '@/schemaValidations/blog-post.schema'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, FileEdit, Trash2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type BlogPostItem = BlogPostListResType['data'][0]

const BlogTableContext = createContext<{
  blogPostIdEdit: number | undefined
  setBlogPostIdEdit: (value: number | undefined) => void
  blogPostArchive: BlogPostItem | null
  setBlogPostArchive: (value: BlogPostItem | null) => void
}>({
  blogPostIdEdit: undefined,
  setBlogPostIdEdit: () => {},
  blogPostArchive: null,
  setBlogPostArchive: () => {},
})

// Helper function to get status badge
function getStatusBadge(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-green-500">Published</Badge>
    case 'DRAFT':
      return <Badge variant="secondary">Draft</Badge>
    case 'ARCHIVED':
      return <Badge variant="outline">Archived</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

// Helper function to parse tags
function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try {
    return JSON.parse(tags)
  } catch {
    return []
  }
}

export const columns: ColumnDef<BlogPostItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'featuredImage',
    header: 'Image',
    cell: ({ row }) => {
      const image = row.getValue('featuredImage') as string | null
      return (
        <div>
          <Avatar className="aspect-square h-[80px] w-[80px] rounded-md object-cover">
            <AvatarImage src={image || ''} />
            <AvatarFallback className="rounded-none">
              {row.original.title.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
          {row.getValue('title')}
        </div>
        {row.original.excerpt && (
          <div className="line-clamp-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
            {row.original.excerpt}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    accessorKey: 'featured',
    header: 'Featured',
    cell: ({ row }) => (row.getValue('featured') ? <Badge>Featured</Badge> : null),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as string | null
      return category ? <Badge variant="outline">{category}</Badge> : <span>-</span>
    },
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = parseTags(row.original.tags)
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'viewCount',
    header: 'Views',
    cell: ({ row }) => <div>{row.getValue('viewCount')}</div>,
  },
  {
    accessorKey: 'publishedAt',
    header: 'Published',
    cell: ({ row }) => {
      const publishedAt = row.getValue('publishedAt') as Date | null
      return publishedAt ? format(new Date(publishedAt), 'MMM dd, yyyy') : <span>-</span>
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as Date
      return format(new Date(createdAt), 'MMM dd, yyyy')
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setBlogPostIdEdit, setBlogPostArchive } = useContext(BlogTableContext)
      const router = useRouter()

      const openEdit = () => {
        setBlogPostIdEdit(row.original.id)
        router.push(`/manage/blogs/${row.original.id}/edit`)
      }

      const openPreview = () => {
        router.push(`/manage/blogs/${row.original.id}/preview`)
      }

      const openArchive = () => {
        setBlogPostArchive(row.original)
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
            <DropdownMenuItem onClick={openPreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openEdit}>
              <FileEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openArchive} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function AlertDialogArchiveBlogPost({
  blogPostArchive,
  setBlogPostArchive,
}: {
  blogPostArchive: BlogPostItem | null
  setBlogPostArchive: (value: BlogPostItem | null) => void
}) {
  const { mutateAsync } = useArchiveBlogPostMutation()
  const archiveBlogPost = async () => {
    if (blogPostArchive) {
      try {
        const result = await mutateAsync(blogPostArchive.id)
        setBlogPostArchive(null)
        toast({
          title: result.payload.message || 'Blog post archived successfully',
        })
      } catch (error) {
        handleErrorApi({
          error,
        })
      }
    }
  }
  return (
    <AlertDialog
      open={Boolean(blogPostArchive)}
      onOpenChange={(value) => {
        if (!value) {
          setBlogPostArchive(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive blog post?</AlertDialogTitle>
          <AlertDialogDescription>
            Blog post{' '}
            <span className="rounded bg-foreground px-1 text-primary-foreground">
              {blogPostArchive?.title}
            </span>{' '}
            will be archived. It will no longer be visible to the public.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={archiveBlogPost}>Archive</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Client-side pagination size
const PAGE_SIZE = 20

export default function BlogTable() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1
  const pageIndex = page - 1

  // Server-side filters and sort
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    searchParams.get('status') || undefined
  )
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'viewCount'>(
    (searchParams.get('sortBy') as 'newest' | 'oldest' | 'viewCount') || 'newest'
  )

  // Local state for debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      // Update URL with search query
      const params = new URLSearchParams(searchParams.toString())
      if (searchQuery) {
        params.set('search', searchQuery)
      } else {
        params.delete('search')
      }
      params.set('page', '1') // Reset to first page on search
      router.push(`/manage/blogs?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, router, searchParams])

  // Fetch data with server-side filters
  const blogPostsQuery = useBlogPostsManageQuery({
    status: statusFilter as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
    search: debouncedSearch || undefined,
    sortBy,
  })

  const allPosts = blogPostsQuery.data?.payload.data ?? []
  const isLoading = blogPostsQuery.isLoading
  const isError = blogPostsQuery.isError

  // Client-side pagination
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: PAGE_SIZE,
  })

  const table = useReactTable({
    data: allPosts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      pagination,
    },
  })

  useEffect(() => {
    table.setPagination({
      pageIndex,
      pageSize: PAGE_SIZE,
    })
  }, [table, pageIndex])

  const [blogPostIdEdit, setBlogPostIdEdit] = useState<number | undefined>()
  const [blogPostArchive, setBlogPostArchive] = useState<BlogPostItem | null>(null)

  // Handle filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? undefined : value)
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    params.set('page', '1')
    router.push(`/manage/blogs?${params.toString()}`)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value as 'newest' | 'oldest' | 'viewCount')
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', value)
    params.set('page', '1')
    router.push(`/manage/blogs?${params.toString()}`)
  }

  return (
    <BlogTableContext.Provider
      value={{ blogPostIdEdit, setBlogPostIdEdit, blogPostArchive, setBlogPostArchive }}
    >
      <div className="w-full space-y-3 sm:space-y-4">
        <AlertDialogArchiveBlogPost
          blogPostArchive={blogPostArchive}
          setBlogPostArchive={setBlogPostArchive}
        />

        {/* Filters and Create button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:py-4">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <Input
              placeholder="Search by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-sm"
            />

            {/* Status Filter */}
            <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="viewCount">Most Views</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create button */}
          <div className="sm:ml-auto">
            <Button asChild>
              <Link href="/manage/blogs/create">Create New Post</Link>
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading blog posts...</div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-destructive">Failed to load blog posts</div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} className="whitespace-nowrap">
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
                          <TableCell key={cell.id} className="whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No blog posts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {table.getPageCount() > 0 && (
              <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:py-4">
                <div className="text-center text-xs text-muted-foreground sm:flex-1 sm:text-left">
                  Showing <strong>{table.getPaginationRowModel().rows.length}</strong> of{' '}
                  <strong>{allPosts.length}</strong> results
                </div>

                <div className="flex justify-center">
                  <AutoPagination
                    page={table.getState().pagination.pageIndex + 1}
                    pageSize={table.getPageCount()}
                    pathname="/manage/blogs"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BlogTableContext.Provider>
  )
}
