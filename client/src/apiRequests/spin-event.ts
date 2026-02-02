import http from '@/lib/http'
import {
  CreateSpinEventBodyType,
  CreateSpinEventResType,
  DeleteSpinEventResType,
  GetActiveSpinEventsResType,
  GetSpinEventResType,
  GetSpinEventsQueryParamsType,
  GetSpinEventsResType,
  ToggleActiveResType,
  UpdateSpinEventBodyType,
  UpdateSpinEventResType,
} from '@/schemaValidations/spin-event.schema'

export const spinEventApiRequest = {
  getSpinEvents: (queryParams?: GetSpinEventsQueryParamsType) =>
    http.get<GetSpinEventsResType>('/admin/spin-events', {
      params: queryParams,
    }),

  getActiveSpinEvents: () => http.get<GetActiveSpinEventsResType>('/employee-spin/events'),

  getSpinEventById: (id: number) => http.get<GetSpinEventResType>(`/admin/spin-events/${id}`),

  createSpinEvent: (body: CreateSpinEventBodyType) =>
    http.post<CreateSpinEventResType>('/admin/spin-events', body),

  updateSpinEvent: (id: number, body: UpdateSpinEventBodyType) =>
    http.put<UpdateSpinEventResType>(`/admin/spin-events/${id}`, body),

  deleteSpinEvent: (id: number) => http.delete<DeleteSpinEventResType>(`/admin/spin-events/${id}`),

  toggleActive: (id: number) =>
    http.put<ToggleActiveResType>(`/admin/spin-events/${id}/toggle-active`, {}),
}

export default spinEventApiRequest
