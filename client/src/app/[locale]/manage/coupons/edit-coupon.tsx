'use client'
import revalidateApiRequest from '@/apiRequests/revalidate'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import {
    CouponDiscountType,
    CouponStatus,
    CouponStatusValues
} from '@/constants/type'
import { cn, handleErrorApi } from '@/lib/utils'
import { useGetCouponQuery, useUpdateCouponMutation } from '@/queries/useCoupon'
import { UpdateCouponBody, UpdateCouponBodyType } from '@/schemaValidations/coupon.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

export default function EditCoupon({
  id,
  setId,
  onSubmitSuccess,
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSubmitSuccess?: () => void
}) {
  const updateCouponMutation = useUpdateCouponMutation()
  const { data } = useGetCouponQuery({ enabled: Boolean(id), id: id as number })
  const form = useForm<UpdateCouponBodyType>({
    resolver: zodResolver(UpdateCouponBody),
    defaultValues: {
      discountType: CouponDiscountType.Percentage,
      discountValue: 0,
      minOrderAmount: undefined,
      applicableDishIds: undefined,
      maxTotalUsage: undefined,
      maxUsagePerGuest: undefined,
      startDate: undefined,
      endDate: undefined,
      status: CouponStatus.Active,
    },
  })

  useEffect(() => {
    if (data) {
      const {
        discountType,
        discountValue,
        minOrderAmount,
        applicableDishIds,
        maxTotalUsage,
        maxUsagePerGuest,
        startDate,
        endDate,
        status,
      } = data.payload.data
      form.reset({
        discountType: discountType as typeof CouponDiscountType.Percentage,
        discountValue,
        minOrderAmount: minOrderAmount ?? undefined,
        applicableDishIds: applicableDishIds ?? undefined,
        maxTotalUsage: maxTotalUsage ?? undefined,
        maxUsagePerGuest: maxUsagePerGuest ?? undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status as typeof CouponStatus.Active,
      })
    }
  }, [data, form])

  const onSubmit = async (values: UpdateCouponBodyType) => {
    if (updateCouponMutation.isPending) return
    try {
      const body: UpdateCouponBodyType & { id: number } = {
        id: id as number,
        ...values,
      }
      const result = await updateCouponMutation.mutateAsync(body)
      await revalidateApiRequest('coupons')
      toast({
        description: result.payload.message,
      })
      reset()
      onSubmitSuccess && onSubmitSuccess()
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      })
    }
  }

  const reset = () => {
    setId(undefined)
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) {
          reset()
        }
      }}
    >
      <DialogContent className="max-h-screen overflow-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit coupon</DialogTitle>
          <DialogDescription>
            Note: Code cannot be changed if the coupon has been used.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            id="edit-coupon-form"
            onSubmit={form.handleSubmit(onSubmit, console.log)}
          >
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="discountType">Discount Type</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={CouponDiscountType.Percentage}>Percentage</SelectItem>
                            <SelectItem value={CouponDiscountType.FixedAmount}>
                              Fixed Amount
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="discountValue">
                        {form.watch('discountType') === CouponDiscountType.Percentage
                          ? 'Discount %'
                          : 'Discount Amount'}
                      </Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="discountValue"
                          className="w-full"
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="minOrderAmount">Min Order Amount</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="minOrderAmount"
                          className="w-full"
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicableDishIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="applicableDishIds">
                        Applicable Dish IDs (JSON array)
                      </Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="applicableDishIds"
                          className="w-full"
                          placeholder='[1, 2, 3] or leave empty for all dishes'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxTotalUsage"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="maxTotalUsage">Max Total Usage</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="maxTotalUsage"
                          className="w-full"
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUsagePerGuest"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="maxUsagePerGuest">Max Usage Per Guest</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="maxUsagePerGuest"
                          className="w-full"
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="startDate">Start Date</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="endDate">End Date</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="status">Status</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CouponStatusValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="edit-coupon-form">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


