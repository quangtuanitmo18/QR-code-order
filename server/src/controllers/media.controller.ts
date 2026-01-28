import { mediaService } from '@/services/media.service'
import { MultipartFile } from '@fastify/multipart'

export const uploadImage = async (data: MultipartFile) => {
  return await mediaService.uploadImage(data)
}
