'use client'

import OrderGuestDetail from '@/app/[locale]/manage/orders/order-guest-detail'
import { OrderTableContext } from '@/app/[locale]/manage/orders/order-table'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrderStatus, OrderStatusValues } from '@/constants/type'
import {
  formatCurrency,
  formatDateTimeToLocaleString,
  getOrderStatus,
  simpleMatchText,
} from '@/lib/utils'
import { GetOrdersResType } from '@/schemaValidations/order.schema'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { useContext } from 'react'

type OrderRow = GetOrdersResType['data'][0]
const orderTableColumns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: 'tableNumber',
    header: 'Table',
    cell: ({ row }) => <div>{row.getValue('tableNumber')}</div>,
    filterFn: (row, columnId, filterValue: string) => {
      if (filterValue === undefined) return true
      return simpleMatchText(String(row.getValue(columnId)), String(filterValue))
    },
  },
  {
    id: 'guestName',
    header: 'Customer',
    cell: function Cell({ row }) {
      const { orderObjectByGuestId } = useContext(OrderTableContext)
      const guest = row.original.guest
      return (
        <div>
          {!guest && (
            <div>
              <span>Deleted</span>
            </div>
          )}
          {guest && (
            <Popover>
              <PopoverTrigger>
                <div>
                  <span>{guest.name}</span>
                  <span className="font-semibold">(#{guest.id})</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] sm:w-[440px]">
                <OrderGuestDetail guest={guest} orders={orderObjectByGuestId[guest.id]} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      )
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (filterValue === undefined) return true
      return simpleMatchText(row.original.guest?.name ?? 'Deleted', String(filterValue))
    },
  },
  {
    id: 'items',
    header: 'Items',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.items.length > 0 && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Image
                  src={row.original.items[0].dishSnapshot.image}
                  alt={row.original.items[0].dishSnapshot.name}
                  width={50}
                  height={50}
                  unoptimized
                  className="h-[50px] w-[50px] cursor-pointer rounded-md object-cover"
                />
              </PopoverTrigger>
              <PopoverContent>
                <div className="space-y-2 text-sm">
                  {row.original.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Image
                        src={item.dishSnapshot.image}
                        alt={item.dishSnapshot.name}
                        width={40}
                        height={40}
                        className="h-[40px] w-[40px] rounded-md object-cover"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.dishSnapshot.name}</span>
                          <Badge className="px-1" variant={'secondary'}>
                            x{item.quantity}
                          </Badge>
                        </div>
                        <div className="italic">
                          {formatCurrency(item.unitPrice)} ·{' '}
                          <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>
                  {row.original.items[0].dishSnapshot.name}
                  {row.original.items.length > 1 && ` + ${row.original.items.length - 1} more`}
                </span>
                <Badge className="px-1" variant={'secondary'}>
                  x{row.original.items.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              </div>
              <span className="italic">{formatCurrency(row.original.totalAmount)}</span>
            </div>
          </>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: function Cell({ row }) {
      const { changeStatus } = useContext(OrderTableContext)
      const changeOrderStatus = async (status: (typeof OrderStatusValues)[number]) => {
        changeStatus({
          orderId: row.original.id,
          status,
        })
      }
      return (
        <Select
          onValueChange={(value: (typeof OrderStatusValues)[number]) => {
            changeOrderStatus(value)
          }}
          defaultValue={OrderStatus.Pending}
          value={row.getValue('status')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {OrderStatusValues.map((status) => (
              <SelectItem key={status} value={status}>
                {getOrderStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
  },
  {
    id: 'orderHandlerName',
    header: 'Handler',
    cell: ({ row }) => <div>{row.original.orderHandler?.name ?? ''}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: () => <div>Create/Update</div>,
    cell: ({ row }) => (
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-4">
          {formatDateTimeToLocaleString(row.getValue('createdAt'))}
        </div>
        <div className="flex items-center space-x-4">
          {formatDateTimeToLocaleString(row.original.updatedAt as unknown as string)}
        </div>
      </div>
    ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setOrderIdEdit } = useContext(OrderTableContext)
      const openEditOrder = () => {
        setOrderIdEdit(row.original.id)
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
            <DropdownMenuItem onClick={openEditOrder}>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default orderTableColumns
