import taskApiRequest from '@/apiRequests/task'
import {
  CreateTaskBodyType,
  GetStatisticsQueryParamsType,
  GetTasksQueryParamsType,
  UpdateTaskBodyType,
} from '@/schemaValidations/task.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useGetTaskStatisticsQuery = (queryParams?: GetStatisticsQueryParamsType) => {
  return useQuery({
    queryFn: () => taskApiRequest.getStatistics(queryParams),
    queryKey: ['tasks', 'statistics', queryParams],
  })
}

export const useGetTasksQuery = (queryParams?: GetTasksQueryParamsType) => {
  return useQuery({
    queryFn: () => taskApiRequest.getTasks(queryParams),
    queryKey: ['tasks', queryParams],
  })
}

export const useGetTaskByIdQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryFn: () => taskApiRequest.getTaskById(id),
    queryKey: ['tasks', id],
    enabled,
  })
}

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTaskBodyType) => taskApiRequest.createTask(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics'] })
    },
  })
}

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTaskBodyType & { id: number }) =>
      taskApiRequest.updateTask(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] })
    },
  })
}

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => taskApiRequest.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics'] })
    },
  })
}
