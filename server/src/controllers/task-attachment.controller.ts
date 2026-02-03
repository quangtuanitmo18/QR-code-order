import { MultipartFile } from '@fastify/multipart'
import { TaskIdParamType, AttachmentIdParamType } from '@/schemaValidations/task-attachment.schema'
import { taskAttachmentService } from '@/services/task-attachment.service'

export const getAttachmentsController = async (taskId: number) => {
  return await taskAttachmentService.getAttachmentsByTaskId(taskId)
}

export const createAttachmentController = async (taskId: number, userId: number, file: MultipartFile) => {
  return await taskAttachmentService.createAttachment({
    taskId,
    file,
    uploadedById: userId
  })
}

export const deleteAttachmentController = async (id: number, userId: number) => {
  await taskAttachmentService.deleteAttachment(id, userId)
  return { message: 'Attachment deleted successfully' }
}
