import calendarApiRequest from '@/apiRequests/calendar'
import {
  CreateEventBodyType,
  GetEventDatesWithCountsQueryParamsType,
  GetEventsQueryParamsType,
  GetNotificationsQueryParamsType,
  UpdateEventBodyType,
} from '@/schemaValidations/calendar.schema'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useGetEventsQuery = (queryParams: GetEventsQueryParamsType) => {
  return useQuery({
    queryFn: () => calendarApiRequest.getEvents(queryParams),
    queryKey: ['calendar', 'events', queryParams],
  })
}

export const useGetEventByIdQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryFn: () => calendarApiRequest.getEventById(id),
    queryKey: ['calendar', 'events', id],
    enabled,
  })
}

export const useGetEventDatesWithCountsQuery = (
  queryParams: GetEventDatesWithCountsQueryParamsType
) => {
  return useQuery({
    queryFn: () => calendarApiRequest.getEventDatesWithCounts(queryParams),
    queryKey: ['calendar', 'event-dates', queryParams],
  })
}

export const useCreateEventMutation = () => {
  return useMutation({
    mutationFn: (body: CreateEventBodyType) => calendarApiRequest.createEvent(body),
  })
}

export const useUpdateEventMutation = () => {
  return useMutation({
    mutationFn: ({ eventId, ...body }: UpdateEventBodyType & { eventId: number }) =>
      calendarApiRequest.updateEvent(eventId, body),
  })
}

export const useDeleteEventMutation = () => {
  return useMutation({
    mutationFn: (eventId: number) => calendarApiRequest.deleteEvent(eventId),
  })
}

export const useGetNotificationsQuery = (queryParams: GetNotificationsQueryParamsType) => {
  return useQuery({
    queryFn: () => calendarApiRequest.getNotifications(queryParams),
    queryKey: ['calendar', 'notifications', queryParams],
    refetchInterval: 30000, // Refetch every 30 seconds for manual refresh
  })
}

export const useMarkNotificationAsReadMutation = () => {
  return useMutation({
    mutationFn: (notificationId: number) =>
      calendarApiRequest.markNotificationAsRead(notificationId),
  })
}

export const useMarkAllNotificationsAsReadMutation = () => {
  return useMutation({
    mutationFn: () => calendarApiRequest.markAllNotificationsAsRead(),
  })
}
