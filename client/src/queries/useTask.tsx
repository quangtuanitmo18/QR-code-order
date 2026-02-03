import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import taskApiRequest from '@/apiRequests/task'
import {
  CreateTaskBodyType,
  GetTasksQueryParamsType,
  UpdateTaskBodyType,
} from '@/schemaValidations/task.schema'

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
    },
  })
}
