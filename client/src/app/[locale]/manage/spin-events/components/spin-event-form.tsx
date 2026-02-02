'use client'

import { Badge } from '@/components/ui/badge'
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
import { useGetEmployeesQuery } from '@/queries/useAccount'
import { useCreateSpinEventMutation, useUpdateSpinEventMutation } from '@/queries/useSpinEvent'
import {
  CreateSpinEventBodyType,
  SpinEventType,
  UpdateSpinEventBody,
} from '@/schemaValidations/spin-event.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface SpinEventFormProps {
  event?: SpinEventType | null
  onSuccess: () => void
  onCancel: () => void
}

export function SpinEventForm({ event, onSuccess, onCancel }: SpinEventFormProps) {
  const createMutation = useCreateSpinEventMutation()
  const updateMutation = useUpdateSpinEventMutation()
  const employeesQuery = useGetEmployeesQuery()

  const employees = employeesQuery.data?.payload.data || []

  // Separate state for employeeIds
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])

  const form = useForm<CreateSpinEventBodyType>({
    resolver: zodResolver(UpdateSpinEventBody) as any,
    defaultValues: {
      name: '',
      description: undefined,
      startDate: new Date(),
      endDate: undefined,
      isActive: true,
    },
  })

  // Reset form when event prop changes (for editing)
  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        description: event.description || undefined,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        isActive: event.isActive,
      })
      // Update resolver when switching between create/edit mode
      form.clearErrors()
    } else {
      form.reset({
        name: '',
        description: undefined,
        startDate: new Date(),
        endDate: undefined,
        isActive: true,
      })
    }
  }, [event, form])

  // Load employee IDs from event if editing
  useEffect(() => {
    if (event) {
      // Try to get employeeIds from spins if available
      if ('spins' in event && Array.isArray(event.spins)) {
        const employeeIds = Array.from(
          new Set(
            event.spins
              .map((spin: any) => spin.employeeId)
              .filter((id: any) => id !== undefined && id !== null)
          )
        ) as number[]
        setSelectedEmployeeIds(employeeIds)
      } else {
        setSelectedEmployeeIds([])
      }
    } else {
      setSelectedEmployeeIds([])
    }
  }, [event])

  const onSubmit = async (data: CreateSpinEventBodyType) => {
    try {
      if (event) {
        const updateData: any = {
          name: data.name,
          description: data.description === undefined ? undefined : data.description || null,
          startDate: data.startDate,
          endDate: data.endDate === undefined ? undefined : data.endDate || null,
          isActive: data.isActive,
          employeeIds: selectedEmployeeIds,
        }
        await updateMutation.mutateAsync({ id: event.id, ...updateData })
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        })
      } else {
        // Validate required fields for create mode
        if (!data.name || !data.startDate) {
          form.setError('root', {
            message: 'Name and start date are required',
          })
          if (!data.name) {
            form.setError('name', { message: 'Name is required' })
          }
          if (!data.startDate) {
            form.setError('startDate', { message: 'Start date is required' })
          }
          return
        }

        const createData: any = {
          name: data.name,
          description: data.description || undefined,
          startDate: data.startDate,
          endDate: data.endDate || undefined,
          isActive: data.isActive ?? true,
          employeeIds: selectedEmployeeIds,
        }
        await createMutation.mutateAsync(createData)
        toast({
          title: 'Success',
          description: 'Event created successfully',
        })
      }
      onSuccess()
    } catch (error: any) {
      handleErrorApi({ error })
    }
  }

  const addEmployee = (employeeId: number) => {
    if (!selectedEmployeeIds.includes(employeeId)) {
      setSelectedEmployeeIds([...selectedEmployeeIds, employeeId])
    }
  }

  const removeEmployee = (employeeId: number) => {
    setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== employeeId))
  }

  const availableEmployees = employees.filter((emp) => !selectedEmployeeIds.includes(emp.id))

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

        {/* Assign Employees Section */}
        <div className="space-y-2">
          <FormLabel>Assign Employees</FormLabel>
          <FormDescription>Select employees who can participate in this spin event</FormDescription>
          <div className="space-y-3">
            {/* Selected Employees Display */}
            {selectedEmployeeIds.length > 0 && (
              <div className="flex min-h-[3rem] flex-wrap gap-2 rounded-lg border p-3">
                {selectedEmployeeIds.map((employeeId) => {
                  const employee = employees.find((emp) => emp.id === employeeId)
                  if (!employee) return null
                  return (
                    <Badge
                      key={employeeId}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      <span>
                        {employee.name} ({employee.email})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEmployee(employeeId)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Select Dropdown */}
            <Select
              value=""
              onValueChange={(value) => {
                if (value) {
                  addEmployee(Number(value))
                }
              }}
              disabled={availableEmployees.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    availableEmployees.length === 0
                      ? 'All employees selected'
                      : 'Select an employee to add...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No more employees available
                  </div>
                ) : (
                  availableEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name} ({employee.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

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
