import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calendarTypeApiRequest } from '@/apiRequests/calendar-type'
import {
  CreateCalendarTypeBodyType,
  GetCalendarTypesQueryParamsType,
  UpdateCalendarTypeBodyType,
} from '@/schemaValidations/calendar-type.schema'

export const useGetCalendarTypesQuery = (queryParams?: GetCalendarTypesQueryParamsType) => {
  return useQuery({
    queryFn: () => calendarTypeApiRequest.getCalendarTypes(queryParams),
    queryKey: ['calendar-types', queryParams],
  })
}

export const useGetCalendarTypeQuery = (id: number) => {
  return useQuery({
    queryFn: () => calendarTypeApiRequest.getCalendarTypeById(id),
    queryKey: ['calendar-types', id],
    enabled: !!id,
  })
}

export const useCreateCalendarTypeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCalendarTypeBodyType) =>
      calendarTypeApiRequest.createCalendarType(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-types'] })
    },
  })
}

export const useUpdateCalendarTypeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCalendarTypeBodyType }) =>
      calendarTypeApiRequest.updateCalendarType(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-types'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-types', variables.id] })
    },
  })
}

export const useDeleteCalendarTypeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => calendarTypeApiRequest.deleteCalendarType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-types'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] }) // Also invalidate calendar events
    },
  })
}

export const useToggleCalendarTypeVisibilityMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => calendarTypeApiRequest.toggleVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-types'] })
    },
  })
}
