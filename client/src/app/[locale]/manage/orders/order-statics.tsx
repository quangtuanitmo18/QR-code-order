import OrderGuestDetail from '@/app/[locale]/manage/orders/order-guest-detail'
import {
  ServingGuestByTableNumber,
  Statics,
  StatusCountObject,
} from '@/app/[locale]/manage/orders/order-table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { OrderStatus, OrderStatusValues } from '@/constants/type'
import { OrderStatusIcon, cn, getOrderStatus } from '@/lib/utils'
import { TableListResType } from '@/schemaValidations/table.schema'
import { Users } from 'lucide-react'
import { Fragment, useState } from 'react'

// Ví dụ:
// const statics: Statics = {
//   status: {
//     Pending: 1,
//     Processing: 2,
//     Delivered: 3,
//     Paid: 5,
//     Rejected: 0
//   },
//   table: {
//     1: { // Bàn số 1
//       20: { // Guest 20
//         Pending: 1,
//         Processing: 2,
//         Delivered: 3,
//         Paid: 5,
//         Rejected: 0
//       },
//       21: { // Guest 21
//         Pending: 1,
//         Processing: 2,
//         Delivered: 3,
//         Paid: 5,
//         Rejected: 0
//       }
//     }
//   }
// }
export default function OrderStatics({
  statics,
  tableList,
  servingGuestByTableNumber,
}: {
  statics: Statics
  tableList: TableListResType['data']
  servingGuestByTableNumber: ServingGuestByTableNumber
}) {
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(0)
  const selectedServingGuest = servingGuestByTableNumber[selectedTableNumber]
  return (
    <Fragment>
      <Dialog
        open={Boolean(selectedTableNumber)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTableNumber(0)
          }
        }}
      >
        <DialogContent className="max-h-full overflow-auto">
          {selectedServingGuest && (
            <DialogHeader>
              <DialogTitle>Customer is seating at table {selectedTableNumber}</DialogTitle>
            </DialogHeader>
          )}
          <div>
            {selectedServingGuest &&
              Object.keys(selectedServingGuest).map((guestId, index) => {
                const orders = selectedServingGuest[Number(guestId)]
                return (
                  <div key={guestId}>
                    <OrderGuestDetail
                      guest={orders[0].guest}
                      orders={orders}
                      onPaySuccess={() => {
                        setSelectedTableNumber(0)
                      }}
                    />
                    {index !== Object.keys(selectedServingGuest).length - 1 && (
                      <Separator className="my-5" />
                    )}
                  </div>
                )
              })}
          </div>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-2 gap-2 py-3 sm:flex sm:flex-wrap sm:items-stretch sm:justify-start sm:gap-4 sm:py-4 md:grid-cols-3 lg:flex">
        {tableList.map((table) => {
          const tableNumber: number = table.number
          const tableStatics: Record<number, StatusCountObject> | undefined =
            statics.table[tableNumber]
          let isEmptyTable = true
          let countObject: StatusCountObject = {
            Pending: 0,
            Processing: 0,
            Delivered: 0,
            Paid: 0,
            Rejected: 0,
          }
          const servingGuestCount = Object.values(
            servingGuestByTableNumber[tableNumber] ?? []
          ).length
          if (tableStatics) {
            for (const guestId in tableStatics) {
              const guestStatics = tableStatics[Number(guestId)]
              if (
                [guestStatics.Pending, guestStatics.Processing, guestStatics.Delivered].some(
                  (status) => status !== 0 && status !== undefined
                )
              ) {
                isEmptyTable = false
              }
              countObject = {
                Pending: countObject.Pending + (guestStatics.Pending ?? 0),
                Processing: countObject.Processing + (guestStatics.Processing ?? 0),
                Delivered: countObject.Delivered + (guestStatics.Delivered ?? 0),
                Paid: countObject.Paid + (guestStatics.Paid ?? 0),
                Rejected: countObject.Rejected + (guestStatics.Rejected ?? 0),
              }
            }
          }
          return (
            <div
              key={tableNumber}
              className={cn(
                'flex min-w-0 cursor-pointer items-stretch gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent',
                {
                  'bg-secondary': !isEmptyTable,
                  'border-transparent': !isEmptyTable,
                  'hover:bg-secondary/80': !isEmptyTable,
                }
              )}
              onClick={() => {
                if (!isEmptyTable) setSelectedTableNumber(tableNumber)
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1 sm:gap-2">
                <div className="text-center text-base font-semibold sm:text-lg">{tableNumber}</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{servingGuestCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Currently serving: {servingGuestCount} Customer</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Separator
                orientation="vertical"
                className={cn('h-auto flex-shrink-0 flex-grow', {
                  'bg-muted-foreground': !isEmptyTable,
                })}
              />
              {isEmptyTable && (
                <div className="flex items-center justify-center text-xs sm:text-sm">Ready</div>
              )}
              {!isEmptyTable && (
                <div className="flex flex-col gap-1 sm:gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <OrderStatusIcon.Pending className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">
                            {countObject[OrderStatus.Pending] ?? 0}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getOrderStatus(OrderStatus.Pending)}:{' '}
                        {countObject[OrderStatus.Pending] ?? 0} Order
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <OrderStatusIcon.Processing className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">
                            {countObject[OrderStatus.Processing] ?? 0}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getOrderStatus(OrderStatus.Processing)}:{' '}
                        {countObject[OrderStatus.Processing] ?? 0} Order
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <OrderStatusIcon.Delivered className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">
                            {countObject[OrderStatus.Delivered] ?? 0}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getOrderStatus(OrderStatus.Delivered)}:{' '}
                        {countObject[OrderStatus.Delivered] ?? 0} Order
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap items-end justify-start gap-2 py-3 sm:gap-4 sm:py-4">
        {OrderStatusValues.map((status) => (
          <Badge variant="secondary" key={status} className="text-xs sm:text-sm">
            {getOrderStatus(status)}: {statics.status[status] ?? 0}
          </Badge>
        ))}
      </div>
    </Fragment>
  )
}
