import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import spinEventApiRequest from '@/apiRequests/spin-event'
import {
  CreateSpinEventBodyType,
  GetSpinEventsQueryParamsType,
  UpdateSpinEventBodyType,
} from '@/schemaValidations/spin-event.schema'

export const useGetSpinEventsQuery = (queryParams?: GetSpinEventsQueryParamsType) => {
  return useQuery({
    queryFn: () => spinEventApiRequest.getSpinEvents(queryParams),
    queryKey: ['spin-events', queryParams],
  })
}

export const useGetActiveSpinEventsQuery = () => {
  return useQuery({
    queryFn: () => spinEventApiRequest.getActiveSpinEvents(),
    queryKey: ['spin-events', 'active'],
  })
}

export const useGetSpinEventByIdQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryFn: () => spinEventApiRequest.getSpinEventById(id),
    queryKey: ['spin-events', id],
    enabled,
  })
}

export const useCreateSpinEventMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateSpinEventBodyType) => spinEventApiRequest.createSpinEvent(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-events'] })
    },
  })
}

export const useUpdateSpinEventMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateSpinEventBodyType & { id: number }) =>
      spinEventApiRequest.updateSpinEvent(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spin-events'] })
      queryClient.invalidateQueries({ queryKey: ['spin-events', variables.id] })
    },
  })
}

export const useDeleteSpinEventMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => spinEventApiRequest.deleteSpinEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-events'] })
    },
  })
}

export const useToggleSpinEventActiveMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => spinEventApiRequest.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['spin-events'] })
      queryClient.invalidateQueries({ queryKey: ['spin-events', id] })
    },
  })
}
