'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CreateCalendarTypeBody,
  CreateCalendarTypeBodyType,
  CalendarTypeType,
  UpdateCalendarTypeBody,
  UpdateCalendarTypeBodyType,
} from '@/schemaValidations/calendar-type.schema'
import {
  useCreateCalendarTypeMutation,
  useUpdateCalendarTypeMutation,
} from '@/queries/useCalendarType'
import { handleErrorApi } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

interface CalendarTypeFormProps {
  calendarType?: CalendarTypeType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const colorOptions = [
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-red-500', label: 'Red' },
  { value: 'bg-yellow-500', label: 'Yellow' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-orange-500', label: 'Orange' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-gray-500', label: 'Gray' },
]

const categoryOptions = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'shared', label: 'Shared' },
]

export function CalendarTypeForm({
  calendarType,
  open,
  onOpenChange,
  onSuccess,
}: CalendarTypeFormProps) {
  const isEdit = !!calendarType
  const createMutation = useCreateCalendarTypeMutation()
  const updateMutation = useUpdateCalendarTypeMutation()

  const form = useForm<CreateCalendarTypeBodyType | UpdateCalendarTypeBodyType>({
    resolver: zodResolver(isEdit ? UpdateCalendarTypeBody : CreateCalendarTypeBody),
    defaultValues: {
      name: '',
      label: '',
      color: 'bg-blue-500',
      category: 'personal',
      visible: true,
    },
  })

  useEffect(() => {
    if (calendarType) {
      form.reset({
        label: calendarType.label,
        color: calendarType.color,
        category: calendarType.category as 'personal' | 'work' | 'shared',
        visible: calendarType.visible,
      })
    } else {
      form.reset({
        name: '',
        label: '',
        color: 'bg-blue-500',
        category: 'personal',
        visible: true,
      })
    }
  }, [calendarType, form, open])

  const onSubmit = async (data: CreateCalendarTypeBodyType | UpdateCalendarTypeBodyType) => {
    try {
      if (isEdit && calendarType) {
        await updateMutation.mutateAsync({
          id: calendarType.id,
          body: data as UpdateCalendarTypeBodyType,
        })
        toast({
          title: 'Success',
          description: 'Calendar type updated successfully',
        })
      } else {
        await createMutation.mutateAsync(data as CreateCalendarTypeBodyType)
        toast({
          title: 'Success',
          description: 'Calendar type created successfully',
        })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Calendar Type' : 'Create New Calendar Type'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the calendar type details below.'
              : 'Create a new calendar type to organize your events.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="work_shift"
                        {...field}
                        disabled={isLoading}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier (lowercase, alphanumeric, underscores only)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Work Shifts" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>Display name for this calendar type</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded ${color.value}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Visible</FormLabel>
                    <FormDescription>Show this calendar type in the calendar view</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
