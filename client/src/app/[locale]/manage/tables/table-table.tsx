'use client'

import { Button } from '@/components/ui/button'
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

import revalidateApiRequest from '@/apiRequests/revalidate'
import AddTable from '@/app/[locale]/manage/tables/add-table'
import EditTable from '@/app/[locale]/manage/tables/edit-table'
import AutoPagination from '@/components/auto-pagination'
import QRCodeTable from '@/components/qrcode-table'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { getTableStatus, handleErrorApi } from '@/lib/utils'
import { useDeleteTableMutation, useTableListQuery } from '@/queries/useTable'
import { TableListResType } from '@/schemaValidations/table.schema'
import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type TableItem = TableListResType['data'][0]

const TableTableContext = createContext<{
  setTableIdEdit: (value: number) => void
  tableIdEdit: number | undefined
  tableDelete: TableItem | null
  setTableDelete: (value: TableItem | null) => void
}>({
  setTableIdEdit: (value: number | undefined) => {},
  tableIdEdit: undefined,
  tableDelete: null,
  setTableDelete: (value: TableItem | null) => {},
})

export const columns: ColumnDef<TableItem>[] = [
  {
    accessorKey: 'number',
    header: 'Table number',
    cell: ({ row }) => <div className="capitalize">{row.getValue('number')}</div>,
    filterFn: (rows, columnId, filterValue) => {
      if (!filterValue) return true
      return String(filterValue) === String(rows.getValue('number'))
    },
  },
  {
    accessorKey: 'capacity',
    header: 'Capacity',
    cell: ({ row }) => <div className="capitalize">{row.getValue('capacity')}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <div>{getTableStatus(row.getValue('status'))}</div>,
  },
  {
    accessorKey: 'token',
    header: 'QR Code',
    cell: ({ row }) => (
      <div>
        <QRCodeTable token={row.getValue('token')} tableNumber={row.getValue('number')} />
      </div>
    ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setTableIdEdit, setTableDelete } = useContext(TableTableContext)
      const openEditTable = () => {
        setTableIdEdit(row.original.number)
      }

      const openDeleteTable = () => {
        setTableDelete(row.original)
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
            <DropdownMenuItem onClick={openEditTable}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={openDeleteTable}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function AlertDialogDeleteTable({
  tableDelete,
  setTableDelete,
}: {
  tableDelete: TableItem | null
  setTableDelete: (value: TableItem | null) => void
}) {
  const { mutateAsync } = useDeleteTableMutation()
  const deleteTable = async () => {
    if (tableDelete) {
      try {
        const result = await mutateAsync(tableDelete.number)
        await revalidateApiRequest('tables')
        setTableDelete(null)
        toast({
          title: result.payload.message,
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
      open={Boolean(tableDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setTableDelete(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete table?</AlertDialogTitle>
          <AlertDialogDescription>
            Table{' '}
            <span className="rounded bg-foreground px-1 text-primary-foreground">
              {tableDelete?.number}
            </span>{' '}
            will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteTable}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
// Số lượng item trên 1 trang
const PAGE_SIZE = 10
export default function TableTable() {
  const searchParam = useSearchParams()
  const page = searchParam.get('page') ? Number(searchParam.get('page')) : 1
  const pageIndex = page - 1
  // const params = Object.fromEntries(searchParam.entries())
  const [tableIdEdit, setTableIdEdit] = useState<number | undefined>()
  const [tableDelete, setTableDelete] = useState<TableItem | null>(null)
  const tableListQuery = useTableListQuery()
  const data = tableListQuery.data?.payload.data ?? []
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex, // Gía trị mặc định ban đầu, không có ý nghĩa khi data được fetch bất đồng bộ
    pageSize: PAGE_SIZE, //default page size
  })

  const table = useReactTable({
    data,
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
    table.setPagination({
      pageIndex,
      pageSize: PAGE_SIZE,
    })
  }, [table, pageIndex])

  return (
    <TableTableContext.Provider
      value={{ tableIdEdit, setTableIdEdit, tableDelete, setTableDelete }}
    >
      <div className="w-full space-y-3 sm:space-y-4">
        <EditTable id={tableIdEdit} setId={setTableIdEdit} />
        <AlertDialogDeleteTable tableDelete={tableDelete} setTableDelete={setTableDelete} />

        {/* Filter and Add button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:py-4">
          <Input
            placeholder="Filter table number"
            value={(table.getColumn('number')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              table.getColumn('number')?.setFilterValue(event.target.value)
            }}
            className="w-full sm:max-w-sm"
          />
          <div className="sm:ml-auto">
            <AddTable />
          </div>
        </div>

        {/* Table with horizontal scroll on mobile */}
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
            <strong>{data.length}</strong> results
          </div>

          <div className="flex justify-center">
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              pathname="/manage/tables"
            />
          </div>
        </div>
      </div>
    </TableTableContext.Provider>
  )
}
