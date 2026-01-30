import http from '@/lib/http'
import {
  CreateEventBodyType,
  CreateEventResType,
  DeleteEventResType,
  GetEventDatesWithCountsQueryParamsType,
  GetEventDatesWithCountsResType,
  GetEventResType,
  GetEventsQueryParamsType,
  GetEventsResType,
  GetNotificationsQueryParamsType,
  GetNotificationsResType,
  MarkNotificationReadResType,
  UpdateEventBodyType,
  UpdateEventResType,
} from '@/schemaValidations/calendar.schema'
import queryString from 'query-string'

const calendarApiRequest = {
  getEvents: (queryParams: GetEventsQueryParamsType) =>
    http.get<GetEventsResType>(
      '/calendar/events?' +
        queryString.stringify({
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
          typeId: queryParams.typeId,
          employeeId: queryParams.employeeId,
        })
    ),
  getEventById: (eventId: number) => http.get<GetEventResType>(`/calendar/events/${eventId}`),
  createEvent: (body: CreateEventBodyType) =>
    http.post<CreateEventResType>('/calendar/events', body),
  updateEvent: (eventId: number, body: UpdateEventBodyType) =>
    http.put<UpdateEventResType>(`/calendar/events/${eventId}`, body),
  deleteEvent: (eventId: number) => http.delete<DeleteEventResType>(`/calendar/events/${eventId}`),
  getEventDatesWithCounts: (queryParams: GetEventDatesWithCountsQueryParamsType) =>
    http.get<GetEventDatesWithCountsResType>(
      '/calendar/event-dates?' +
        queryString.stringify({
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
        })
    ),
  getNotifications: (queryParams: GetNotificationsQueryParamsType) =>
    http.get<GetNotificationsResType>(
      '/calendar/notifications?' +
        queryString.stringify({
          unreadOnly: queryParams.unreadOnly,
        })
    ),
  markNotificationAsRead: (notificationId: number) =>
    http.put<MarkNotificationReadResType>(`/calendar/notifications/${notificationId}/read`, {}),
  markAllNotificationsAsRead: () =>
    http.put<MarkNotificationReadResType>('/calendar/notifications/read-all', {}),
}

export default calendarApiRequest
