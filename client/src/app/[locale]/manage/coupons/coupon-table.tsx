'use client'

import AddCoupon from '@/app/[locale]/manage/coupons/add-coupon'
import EditCoupon from '@/app/[locale]/manage/coupons/edit-coupon'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { formatCurrency, handleErrorApi } from '@/lib/utils'
import { useCouponListQuery, useDeleteCouponMutation } from '@/queries/useCoupon'
import { CouponListResType } from '@/schemaValidations/coupon.schema'
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
import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type CouponItem = CouponListResType['data'][0]

const CouponTableContext = createContext<{
  setCouponIdEdit: (value: number) => void
  couponIdEdit: number | undefined
  couponDelete: CouponItem | null
  setCouponDelete: (value: CouponItem | null) => void
}>({
  setCouponIdEdit: (value: number | undefined) => {},
  couponIdEdit: undefined,
  couponDelete: null,
  setCouponDelete: (value: CouponItem | null) => {},
})

export const getColumns = (t: any): ColumnDef<CouponItem>[] => [
  {
    accessorKey: 'id',
    header: t('id'),
  },
  {
    accessorKey: 'code',
    header: t('code'),
    cell: ({ row }) => <div className="font-mono font-semibold">{row.getValue('code')}</div>,
  },
  {
    accessorKey: 'discountType',
    header: t('type'),
    cell: ({ row }) => <div>{row.getValue('discountType')}</div>,
  },
  {
    accessorKey: 'discountValue',
    header: t('discount'),
    cell: ({ row }) => {
      const type = row.original.discountType
      const value = row.getValue('discountValue') as number
      return <div>{type === 'PERCENTAGE' ? `${value}%` : formatCurrency(value)}</div>
    },
  },
  {
    accessorKey: 'minOrderAmount',
    header: t('minOrder'),
    cell: ({ row }) => {
      const value = row.getValue('minOrderAmount') as number | null
      return <div>{value ? formatCurrency(value) : '-'}</div>
    },
  },
  {
    accessorKey: 'maxTotalUsage',
    header: t('maxTotal'),
    cell: ({ row }) => {
      const value = row.getValue('maxTotalUsage') as number | null
      return <div>{value ?? t('unlimited')}</div>
    },
  },
  {
    accessorKey: 'maxUsagePerGuest',
    header: t('maxPerGuest'),
    cell: ({ row }) => {
      const value = row.getValue('maxUsagePerGuest') as number | null
      return <div>{value ?? t('unlimited')}</div>
    },
  },
  {
    accessorKey: 'usageCount',
    header: t('used'),
    cell: ({ row }) => <div>{row.getValue('usageCount')}</div>,
  },
  {
    accessorKey: 'startDate',
    header: t('startDate'),
    cell: ({ row }) => {
      const date = row.getValue('startDate') as Date
      return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>
    },
  },
  {
    accessorKey: 'endDate',
    header: t('endDate'),
    cell: ({ row }) => {
      const date = row.getValue('endDate') as Date
      return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>
    },
  },
  {
    accessorKey: 'status',
    header: t('status'),
    cell: ({ row }) => <div>{row.getValue('status')}</div>,
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setCouponIdEdit, setCouponDelete } = useContext(CouponTableContext)
      const openEditCoupon = () => {
        setCouponIdEdit(row.original.id)
      }

      const openDeleteCoupon = () => {
        setCouponDelete(row.original)
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
            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openEditCoupon}>{t('edit')}</DropdownMenuItem>
            <DropdownMenuItem onClick={openDeleteCoupon}>{t('delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function AlertDialogDeleteCoupon({
  couponDelete,
  setCouponDelete,
}: {
  couponDelete: CouponItem | null
  setCouponDelete: (value: CouponItem | null) => void
}) {
  const t = useTranslations('Coupons')
  const { mutateAsync } = useDeleteCouponMutation()
  const deleteCoupon = async () => {
    if (couponDelete) {
      try {
        const result = await mutateAsync(couponDelete.id)
        setCouponDelete(null)
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
      open={Boolean(couponDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setCouponDelete(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteCoupon')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich('deleteConfirm', {
              code: couponDelete?.code ?? '',
              span: (chunks) => (
                <span className="rounded bg-foreground px-1 text-primary-foreground">{chunks}</span>
              ),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteCoupon}>{t('continue')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const PAGE_SIZE = 10
export default function CouponTable() {
  const t = useTranslations('Coupons')
  const searchParam = useSearchParams()
  const page = searchParam.get('page') ? Number(searchParam.get('page')) : 1
  const pageIndex = page - 1
  const [couponIdEdit, setCouponIdEdit] = useState<number | undefined>()
  const [couponDelete, setCouponDelete] = useState<CouponItem | null>(null)
  const couponListQuery = useCouponListQuery()
  const data = couponListQuery.data?.payload.data ?? []
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: PAGE_SIZE,
  })

  const table = useReactTable({
    data,
    columns: getColumns(t),
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
    <CouponTableContext.Provider
      value={{ couponIdEdit, setCouponIdEdit, couponDelete, setCouponDelete }}
    >
      <div className="w-full space-y-3 sm:space-y-4">
        <EditCoupon id={couponIdEdit} setId={setCouponIdEdit} />
        <AlertDialogDeleteCoupon couponDelete={couponDelete} setCouponDelete={setCouponDelete} />
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder={t('filterByCode')}
            value={(table.getColumn('code')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('code')?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <AddCoupon />
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
                  <TableCell colSpan={getColumns(t).length} className="h-24 text-center">
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:py-4">
          <div className="text-center text-xs text-muted-foreground sm:flex-1 sm:text-left">
            {t('showingLength', {
              length: table.getPaginationRowModel().rows.length,
              total: data.length,
            })}
          </div>

          <div className="flex justify-center">
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              pathname="/manage/coupons"
            />
          </div>
        </div>
      </div>
    </CouponTableContext.Provider>
  )
}
