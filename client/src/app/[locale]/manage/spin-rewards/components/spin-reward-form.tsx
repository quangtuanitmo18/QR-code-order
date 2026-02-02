'use client'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { useGetSpinEventsQuery } from '@/queries/useSpinEvent'
import { useCreateSpinRewardMutation, useUpdateSpinRewardMutation } from '@/queries/useSpinReward'
import {
  CreateSpinRewardBody,
  CreateSpinRewardBodyType,
  SpinRewardType,
  SpinRewardTypeValues,
  UpdateSpinRewardBodyType,
} from '@/schemaValidations/spin-reward.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface SpinRewardFormProps {
  reward?: SpinRewardType | null
  onSuccess: () => void
  onCancel: () => void
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
]

export function SpinRewardForm({ reward, onSuccess, onCancel }: SpinRewardFormProps) {
  const createMutation = useCreateSpinRewardMutation()
  const updateMutation = useUpdateSpinRewardMutation()
  // When editing, load all events (including inactive) to show the current event
  // When creating, only load active events
  const { data: eventsData } = useGetSpinEventsQuery(reward ? undefined : { isActive: true })

  const events = eventsData?.payload?.data ?? []

  const form = useForm<CreateSpinRewardBodyType>({
    resolver: zodResolver(CreateSpinRewardBody),
    defaultValues: reward
      ? {
          name: reward.name,
          description: reward.description || undefined,
          type: reward.type as (typeof SpinRewardTypeValues)[number],
          value: reward.value || undefined,
          probability: reward.probability,
          color: reward.color,
          icon: reward.icon || undefined,
          isActive: reward.isActive,
          order: reward.order,
          maxQuantity: reward.maxQuantity || undefined,
          eventId: reward?.event?.id || undefined,
        }
      : {
          name: '',
          description: undefined,
          type: 'BONUS',
          value: undefined,
          probability: 0.1,
          color: 'bg-blue-500',
          icon: undefined,
          isActive: true,
          order: 0,
          maxQuantity: undefined,
          eventId: undefined,
        },
  })

  // When creating a new reward, auto-select the first active event once loaded
  useEffect(() => {
    if (reward) {
      // When editing, ensure eventId is set if reward has one
      if (reward.eventId && !form.getValues('eventId')) {
        form.setValue('eventId', reward.eventId)
      }
      return
    }
    if (!events.length) return

    const currentEventId = form.getValues('eventId')
    if (!currentEventId) {
      form.setValue('eventId', events[0].id)
    }
  }, [events, form, reward])

  const onSubmit = async (data: CreateSpinRewardBodyType) => {
    try {
      if (reward) {
        const updateData: UpdateSpinRewardBodyType = {
          name: data.name,
          description: data.description,
          type: data.type,
          value: data.value,
          probability: data.probability,
          color: data.color,
          icon: data.icon,
          isActive: data.isActive,
          order: data.order,
          maxQuantity: data.maxQuantity,
        }
        // Remove undefined values to avoid sending empty body
        const cleanedData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        ) as UpdateSpinRewardBodyType
        await updateMutation.mutateAsync({ id: reward.id, body: cleanedData })
        toast({
          title: 'Success',
          description: 'Reward updated successfully',
        })
      } else {
        await createMutation.mutateAsync(data)
        toast({
          title: 'Success',
          description: 'Reward created successfully',
        })
      }
      onSuccess()
    } catch (error: any) {
      handleErrorApi({ error })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value ? field.value.toString() : undefined}
                disabled={!!reward} // Can't change event for existing reward
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {reward
                  ? 'Event cannot be changed after creation'
                  : 'Select the event this reward belongs to'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Bonus 100k" {...field} />
              </FormControl>
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
                <Textarea placeholder="Optional description" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SpinRewardTypeValues.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
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
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probability (0.0 - 1.0) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Current: {(field.value * 100).toFixed(1)}%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Display order on wheel</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maxQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Quantity (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormDescription>
                Maximum number of times this reward can be won. Leave empty for unlimited.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder='JSON string, e.g., {"amount": 100000}'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>JSON string for reward value</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Icon name from lucide-react"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>Only active rewards can be won</FormDescription>
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
              : reward
                ? 'Update'
                : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
