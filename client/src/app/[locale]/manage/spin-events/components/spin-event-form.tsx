'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  CreateSpinEventBody,
  CreateSpinEventBodyType,
  SpinEventType,
  UpdateSpinEventBodyType,
} from '@/schemaValidations/spin-event.schema'
import { useCreateSpinEventMutation, useUpdateSpinEventMutation } from '@/queries/useSpinEvent'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { format } from 'date-fns'

interface SpinEventFormProps {
  event?: SpinEventType | null
  onSuccess: () => void
  onCancel: () => void
}

export function SpinEventForm({ event, onSuccess, onCancel }: SpinEventFormProps) {
  const createMutation = useCreateSpinEventMutation()
  const updateMutation = useUpdateSpinEventMutation()

  const form = useForm<CreateSpinEventBodyType>({
    resolver: zodResolver(CreateSpinEventBody),
    defaultValues: event
      ? {
          name: event.name,
          description: event.description || undefined,
          startDate: new Date(event.startDate),
          endDate: event.endDate ? new Date(event.endDate) : undefined,
          isActive: event.isActive,
        }
      : {
          name: '',
          description: undefined,
          startDate: new Date(),
          endDate: undefined,
          isActive: true,
        },
  })

  const onSubmit = async (data: CreateSpinEventBodyType) => {
    try {
      if (event) {
        const updateData: UpdateSpinEventBodyType = {
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: data.isActive,
        }
        await updateMutation.mutateAsync({ id: event.id, ...updateData })
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        })
      } else {
        await createMutation.mutateAsync(data)
        toast({
          title: 'Success',
          description: 'Event created successfully',
        })
      }
      onSuccess()
    } catch (error) {
      handleErrorApi(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tết 2025" {...field} />
              </FormControl>
              <FormDescription>The name of the spin event</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description for this event"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>Optional description of the event</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => {
                      field.onChange(new Date(e.target.value))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => {
                      field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                    }}
                  />
                </FormControl>
                <FormDescription>Leave empty for no end date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>Only active events can be used for spins</FormDescription>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : event
                ? 'Update'
                : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
