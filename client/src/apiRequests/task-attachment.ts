import http from '@/lib/http'
import {
  DeleteAttachmentResType,
  GetAttachmentsResType,
} from '@/schemaValidations/task-attachment.schema'

export const taskAttachmentApiRequest = {
  getAttachments: (taskId: number) =>
    http.get<GetAttachmentsResType>(`/tasks/${taskId}/attachments`),

  uploadAttachment: (taskId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    // Don't set Content-Type header - browser will set it automatically with boundary
    return http.post<GetAttachmentsResType>(`/tasks/${taskId}/attachments`, formData)
  },

  deleteAttachment: (id: number) =>
    http.delete<DeleteAttachmentResType>(`/tasks/attachments/${id}`),
}

export default taskAttachmentApiRequest
