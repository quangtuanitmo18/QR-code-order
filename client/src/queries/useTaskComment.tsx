import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import taskCommentApiRequest from '@/apiRequests/task-comment'
import {
  CreateCommentBodyType,
  UpdateCommentBodyType,
} from '@/schemaValidations/task-comment.schema'

export const useGetCommentsQuery = (taskId: number, enabled: boolean = true) => {
  return useQuery({
    queryFn: () => taskCommentApiRequest.getComments(taskId),
    queryKey: ['task-comments', taskId],
    enabled: enabled && taskId > 0,
  })
}

export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, ...body }: CreateCommentBodyType & { taskId: number }) =>
      taskCommentApiRequest.createComment(taskId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
    },
  })
}

export const useUpdateCommentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, taskId, ...body }: UpdateCommentBodyType & { id: number; taskId: number }) =>
      taskCommentApiRequest.updateComment(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
    },
  })
}

export const useDeleteCommentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, taskId }: { id: number; taskId: number }) =>
      taskCommentApiRequest.deleteComment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
    },
  })
}
