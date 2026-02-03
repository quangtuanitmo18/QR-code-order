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
import { useGetEmployeesQuery } from '@/queries/useAccount'
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/queries/useTask'
import { CreateTaskBodyType, TaskType, UpdateTaskBody } from '@/schemaValidations/task.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { categories, priorities, statuses } from '../data/constants'

interface TaskFormProps {
  task?: TaskType | null
  onClose: () => void
}

export function TaskForm({ task, onClose }: TaskFormProps) {
  const createMutation = useCreateTaskMutation()
  const updateMutation = useUpdateTaskMutation()
  const employeesQuery = useGetEmployeesQuery()

  const employees = employeesQuery.data?.payload.data || []

  const form = useForm<CreateTaskBodyType>({
    resolver: zodResolver(UpdateTaskBody) as any,
    defaultValues: {
      title: '',
      description: undefined,
      status: 'todo',
      category: 'Feature',
      priority: 'Normal',
      dueDate: undefined,
      assignedToId: undefined,
    },
  })

  // Reset form when task prop changes (for editing)
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || undefined,
        status: task.status as any,
        category: task.category as any,
        priority: task.priority as any,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        assignedToId: task.assignedToId || undefined,
      })
      form.clearErrors()
    } else {
      form.reset({
        title: '',
        description: undefined,
        status: 'todo',
        category: 'Feature',
        priority: 'Normal',
        dueDate: undefined,
        assignedToId: undefined,
      })
    }
  }, [task, form])

  const onSubmit = async (data: CreateTaskBodyType) => {
    try {
      if (task) {
        const updateData: any = {
          title: data.title,
          description: data.description === undefined ? undefined : data.description || null,
          status: data.status,
          category: data.category,
          priority: data.priority,
          dueDate: data.dueDate || null,
          assignedToId: data.assignedToId || null,
        }
        await updateMutation.mutateAsync({ id: task.id, ...updateData })
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        })
      } else {
        // Validate required fields for create mode
        if (!data.title || !data.category) {
          form.setError('root', {
            message: 'Title and category are required',
          })
          if (!data.title) {
            form.setError('title', { message: 'Title is required' })
          }
          if (!data.category) {
            form.setError('category', { message: 'Category is required' })
          }
          return
        }

        const createData: any = {
          title: data.title,
          description: data.description || undefined,
          status: data.status || 'todo',
          category: data.category,
          priority: data.priority || 'Normal',
          dueDate: data.dueDate || undefined,
          assignedToId: data.assignedToId || undefined,
        }
        await createMutation.mutateAsync(createData)
        toast({
          title: 'Success',
          description: 'Task created successfully',
        })
      }
      onClose()
    } catch (error: any) {
      handleErrorApi({ error })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title..." {...field} />
              </FormControl>
              <FormDescription>The title of the task</FormDescription>
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
                  placeholder="Optional description for this task"
                  {...field}
                  value={field.value || ''}
                  rows={4}
                />
              </FormControl>
              <FormDescription>Optional description of the task</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
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
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center">
                          {status.icon && (
                            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          {status.label}
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
            name="assignedToId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign To</FormLabel>
                <Select
                  onValueChange={(value) => {
                    // Use "unassigned" as special value instead of empty string
                    field.onChange(value === 'unassigned' ? null : Number(value))
                  }}
                  value={field.value ? field.value.toString() : 'unassigned'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} ({employee.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Optional: Assign this task to an employee</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date (Optional)</FormLabel>
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
              <FormDescription>Optional due date for this task</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : task
                ? 'Update'
                : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
