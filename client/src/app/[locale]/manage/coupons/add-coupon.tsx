'use client'
import revalidateApiRequest from '@/apiRequests/revalidate'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { useAddCouponMutation } from '@/queries/useCoupon'
import { CreateCouponBody, CreateCouponBodyType } from '@/schemaValidations/coupon.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export default function AddCoupon() {
  const [open, setOpen] = useState(false)
  const addCouponMutation = useAddCouponMutation()
  const form = useForm<CreateCouponBodyType>({
    resolver: zodResolver(CreateCouponBody),
    defaultValues: {
      code: '',
      discountType: CouponDiscountType.Percentage,
      discountValue: 0,
      minOrderAmount: undefined,
      applicableDishIds: undefined,
      maxTotalUsage: undefined,
      maxUsagePerGuest: undefined,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: CouponStatus.Active,
    },
  })

  const reset = () => {
    form.reset({
      code: '',
      discountType: CouponDiscountType.Percentage,
      discountValue: 0,
      minOrderAmount: undefined,
      applicableDishIds: undefined,
      maxTotalUsage: undefined,
      maxUsagePerGuest: undefined,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: CouponStatus.Active,
    })
  }

  const onSubmit = async (values: CreateCouponBodyType) => {
    if (addCouponMutation.isPending) return
    try {
      const result = await addCouponMutation.mutateAsync(values)
      await revalidateApiRequest('coupons')
      toast({
        description: result.payload.message,
      })
      reset()
      setOpen(false)
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      })
    }
  }

  return (
    <Dialog
      onOpenChange={(value) => {
        if (!value) {
          reset()
        }
        setOpen(value)
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add coupon</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen overflow-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add coupon</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            id="add-coupon-form"
            onSubmit={form.handleSubmit(onSubmit, console.log)}
            onReset={reset}
          >
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="code">Code</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="code"
                          className="w-full uppercase"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="discountType">Discount Type</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Label htmlFor="minOrderAmount">Min Order Amount (optional)</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="minOrderAmount"
                          className="w-full"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
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
                        Applicable Dish IDs (optional, JSON array)
                      </Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="applicableDishIds"
                          className="w-full"
                          placeholder='[1, 2, 3] or leave empty for all dishes'
                          {...field}
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
                      <Label htmlFor="maxTotalUsage">Max Total Usage (optional)</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="maxTotalUsage"
                          className="w-full"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
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
                      <Label htmlFor="maxUsagePerGuest">Max Usage Per Guest (optional)</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="maxUsagePerGuest"
                          className="w-full"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          <Button type="submit" form="add-coupon-form">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


