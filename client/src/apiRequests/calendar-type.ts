import http from '@/lib/http'
import {
  CreateCalendarTypeBodyType,
  CreateCalendarTypeResType,
  DeleteCalendarTypeResType,
  GetCalendarTypeResType,
  GetCalendarTypesQueryParamsType,
  GetCalendarTypesResType,
  ToggleVisibilityResType,
  UpdateCalendarTypeBodyType,
  UpdateCalendarTypeResType,
} from '@/schemaValidations/calendar-type.schema'

export const calendarTypeApiRequest = {
  getCalendarTypes: (queryParams?: GetCalendarTypesQueryParamsType) =>
    http.get<GetCalendarTypesResType>('/calendar-types', {
      params: queryParams,
    }),

  getCalendarTypeById: (id: number) => http.get<GetCalendarTypeResType>(`/calendar-types/${id}`),

  createCalendarType: (body: CreateCalendarTypeBodyType) =>
    http.post<CreateCalendarTypeResType>('/calendar-types', body),

  updateCalendarType: (id: number, body: UpdateCalendarTypeBodyType) =>
    http.put<UpdateCalendarTypeResType>(`/calendar-types/${id}`, body),

  deleteCalendarType: (id: number) =>
    http.delete<DeleteCalendarTypeResType>(`/calendar-types/${id}`),

  toggleVisibility: (id: number) =>
    http.put<ToggleVisibilityResType>(`/calendar-types/${id}/toggle-visibility`, {}),
}
