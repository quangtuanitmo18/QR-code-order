'use client'

import { useTranslations } from 'next-intl'
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
  UpdateSpinRewardBodyType,
} from '@/schemaValidations/spin-reward.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface SpinRewardFormProps {
  reward?: SpinRewardType | null
  onSuccess: () => void
  onCancel: () => void
}

const colorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'red', label: 'Red' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'orange', label: 'Orange' },
  { value: 'indigo', label: 'Indigo' },
]

export function SpinRewardForm({ reward, onSuccess, onCancel }: SpinRewardFormProps) {
  const t = useTranslations('SpinRewards')
  const createMutation = useCreateSpinRewardMutation()
  const updateMutation = useUpdateSpinRewardMutation()
  // When editing, load all events (including inactive) to show the current event
  // When creating, only load active events
  const { data: eventsData } = useGetSpinEventsQuery(reward ? undefined : { isActive: true })

  const eventsDataRaw = eventsData?.payload?.data
  const events = React.useMemo(() => eventsDataRaw ?? [], [eventsDataRaw])

  const form = useForm<CreateSpinRewardBodyType>({
    resolver: zodResolver(CreateSpinRewardBody),
    defaultValues: reward
      ? {
          name: reward.name,
          description: reward.description || undefined,
          type: reward.type,
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
          type: '',
          value: undefined,
          probability: 0.1,
          color: 'blue',
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
          description: t('updateSuccess'),
        })
      } else {
        await createMutation.mutateAsync(data)
        toast({
          title: 'Success',
          description: t('createSuccess'),
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
                  ? t('eventCannotBeChanged')
                  : t('selectEventForReward')}
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
              <FormLabel>{t('name')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('exampleName')} {...field} />
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
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('optionalDescription')} {...field} value={field.value || ''} />
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
                <FormLabel>{t('type')} *</FormLabel>
                <FormControl>
                  <Input placeholder={t('exampleType')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('color')} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectAColor')} />
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
                <FormLabel>{t('probability')} (0.0 - 1.0) *</FormLabel>
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
                <FormDescription>{t('currentProbability', { probability: (field.value * 100).toFixed(1) })}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('order')} *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>{t('displayOrderOnWheel')}</FormDescription>
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
              <FormLabel>{t('maximumQuantity')} ({t('optional')})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={t('leaveEmptyForUnlimited')}
                  {...field}
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormDescription>
                {t('maxQuantityDescription')}
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
              <FormLabel>{t('value')} ({t('optional')})</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('jsonStringForValue')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>{t('jsonStringForRewardValue')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('iconName')} ({t('optional')})</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('iconNameHelper')}
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
