import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import taskAttachmentApiRequest from '@/apiRequests/task-attachment'

export const useGetAttachmentsQuery = (taskId: number, enabled: boolean = true) => {
  return useQuery({
    queryFn: () => taskAttachmentApiRequest.getAttachments(taskId),
    queryKey: ['task-attachments', taskId],
    enabled: enabled && taskId > 0,
  })
}

export const useUploadAttachmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: number; file: File }) =>
      taskAttachmentApiRequest.uploadAttachment(taskId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
    },
  })
}

export const useDeleteAttachmentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, taskId }: { id: number; taskId: number }) =>
      taskAttachmentApiRequest.deleteAttachment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
    },
  })
}
