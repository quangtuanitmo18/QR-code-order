'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Clock, MapPin, Users, Type, Tag } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  CalendarEventType,
  CreateEventBodyType,
  UpdateEventBodyType,
} from '@/schemaValidations/calendar.schema'
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from '@/queries/useCalendar'
import { useGetAccountList } from '@/queries/useAccount'
import { useGetCalendarTypesQuery } from '@/queries/useCalendarType'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { Role } from '@/constants/type'

interface EventFormProps {
  event?: CalendarEventType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onDelete?: () => void
}

const recurringTypes = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function EventForm({ event, open, onOpenChange, onSave, onDelete }: EventFormProps) {
  const createEventMutation = useCreateEventMutation()
  const updateEventMutation = useUpdateEventMutation()
  const deleteEventMutation = useDeleteEventMutation()
  const accountsQuery = useGetAccountList()
  const calendarTypesQuery = useGetCalendarTypesQuery({ visible: true })

  const employees =
    accountsQuery.data?.payload.data?.filter((acc) => acc.role === Role.Employee) || []
  const calendarTypes = calendarTypesQuery.data?.payload.data || []

  const [formData, setFormData] = useState<{
    title: string
    description: string
    typeId: number
    startDate: Date
    endDate: Date
    allDay: boolean
    location: string
    color: string | null
    isRecurring: boolean
    recurringType: 'daily' | 'weekly' | 'monthly'
    recurringInterval: number
    recurringDayOfWeek: number
    recurringDayOfMonth: number
    employeeIds: number[]
  }>({
    title: '',
    description: '',
    typeId: calendarTypes[0]?.id || 0,
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    location: '',
    color: null,
    isRecurring: false,
    recurringType: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurringInterval: 1,
    recurringDayOfWeek: 1, // Monday
    recurringDayOfMonth: 1,
    employeeIds: [] as number[],
  })

  const [showStartCalendar, setShowStartCalendar] = useState(false)
  const [showEndCalendar, setShowEndCalendar] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate)
      const endDate = new Date(event.endDate)
      setFormData({
        title: event.title,
        description: event.description || '',
        typeId: event.typeId,
        startDate,
        endDate,
        allDay: event.allDay,
        location: event.location || '',
        color: event.color || event.type.color,
        isRecurring: event.isRecurring,
        recurringType: 'daily',
        recurringInterval: 1,
        recurringDayOfWeek: 1,
        recurringDayOfMonth: 1,
        employeeIds: event.assignments?.map((a) => a.employee.id) || [],
      })
      setStartTime(format(startDate, 'HH:mm'))
      setEndTime(format(endDate, 'HH:mm'))
    } else {
      // Reset form for new event
      const now = new Date()
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
      setFormData({
        title: '',
        description: '',
        typeId: calendarTypes[0]?.id || 0,
        startDate: now,
        endDate: oneHourLater,
        allDay: false,
        location: '',
        color: null,
        isRecurring: false,
        recurringType: 'daily',
        recurringInterval: 1,
        recurringDayOfWeek: 1,
        recurringDayOfMonth: 1,
        employeeIds: [],
      })
      setStartTime(format(now, 'HH:mm'))
      setEndTime(format(oneHourLater, 'HH:mm'))
    }
  }, [event, open, calendarTypes])

  const handleSave = async () => {
    try {
      // Combine date and time
      const startDateTime = new Date(formData.startDate)
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      startDateTime.setHours(startHours, startMinutes, 0, 0)

      const endDateTime = new Date(formData.endDate)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      // Build recurring rule if needed
      let recurringRule: string | null = null
      if (formData.isRecurring) {
        const rule: any = {
          type: formData.recurringType,
          interval: formData.recurringInterval,
        }
        if (formData.recurringType === 'weekly') {
          rule.dayOfWeek = formData.recurringDayOfWeek
        } else if (formData.recurringType === 'monthly') {
          rule.dayOfMonth = formData.recurringDayOfMonth
        }
        recurringRule = JSON.stringify(rule)
      }

      const eventData: CreateEventBodyType | UpdateEventBodyType = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay: formData.allDay,
        location: formData.location || undefined,
        color: formData.color,
        isRecurring: formData.isRecurring,
        recurringRule: recurringRule || undefined,
        employeeIds: formData.type === EventType.WORK_SHIFT ? formData.employeeIds : undefined,
      }

      if (event) {
        // Update existing event
        await updateEventMutation.mutateAsync({
          eventId: event.id,
          ...eventData,
        })
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        })
      } else {
        // Create new event
        await createEventMutation.mutateAsync(eventData as CreateEventBodyType)
        toast({
          title: 'Success',
          description: 'Event created successfully',
        })
      }

      onSave()
      onOpenChange(false)
    } catch (error) {
      handleErrorApi({ error, setError: () => {} })
    }
  }

  const handleDelete = async () => {
    if (!event?.id) return

    try {
      await deleteEventMutation.mutateAsync(event.id)
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      })
      onDelete?.()
      onOpenChange(false)
    } catch (error) {
      handleErrorApi({ error, setError: () => {} })
    }
  }

  const toggleEmployee = (employeeId: number) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter((id) => id !== employeeId)
        : [...prev.employeeIds, employeeId],
    }))
  }

  const selectedEventType = calendarTypes.find((t) => t.id === formData.typeId)
  const isWorkShift = selectedEventType?.name === 'work_shift'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', selectedEventType?.color)} />
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>
            {event ? 'Make changes to this event' : 'Add a new event to your calendar'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Event Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter event title..."
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="text-lg font-medium"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Event Type *
            </Label>
            <Select
              value={formData.typeId.toString()}
              onValueChange={(value) => {
                const typeId = parseInt(value, 10)
                const selectedType = calendarTypes.find((t) => t.id === typeId)
                setFormData((prev) => ({
                  ...prev,
                  typeId,
                  color: selectedType?.color || null,
                  // Clear employeeIds if not work_shift
                  employeeIds: selectedType?.name === 'work_shift' ? prev.employeeIds : [],
                }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendarTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className={cn('h-3 w-3 rounded-full', type.color)} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Start Date *
              </Label>
              <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(formData.startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({ ...prev, startDate: date }))
                        setShowStartCalendar(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time *
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={formData.allDay}
              />
            </div>
          </div>

          {/* End Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(formData.endDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({ ...prev, endDate: date }))
                        setShowEndCalendar(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Time *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={formData.allDay}
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="all-day"
              checked={formData.allDay}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, allDay: checked }))}
            />
            <Label htmlFor="all-day">All day event</Label>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Add location..."
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          {/* Employee Assignment (for work_shift) */}
          {isWorkShift && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign Employees * (at least 1 required)
              </Label>
              <div className="max-h-48 overflow-y-auto rounded-md border p-4">
                {employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employees available</p>
                ) : (
                  <div className="space-y-2">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={formData.employeeIds.includes(employee.id)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                        />
                        <Label
                          htmlFor={`employee-${employee.id}`}
                          className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {employee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{employee.name}</span>
                          <span className="text-xs text-muted-foreground">({employee.email})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recurring Event */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isRecurring: checked }))
                }
              />
              <Label htmlFor="recurring">Recurring event</Label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-3 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.recurringType}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                      setFormData((prev) => ({ ...prev, recurringType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recurringTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurringInterval}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurringInterval: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                {formData.recurringType === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select
                      value={formData.recurringDayOfWeek.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, recurringDayOfWeek: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.recurringType === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurringDayOfMonth}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurringDayOfMonth: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add description..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button
              onClick={handleSave}
              className="flex-1 cursor-pointer"
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
            >
              {event ? 'Update Event' : 'Create Event'}
            </Button>
            {event && onDelete && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="cursor-pointer"
                disabled={deleteEventMutation.isPending}
              >
                Delete
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
