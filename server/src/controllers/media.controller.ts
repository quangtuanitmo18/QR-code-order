import envConfig, { API_URL } from '@/config'
import { randomId } from '@/utils/helpers'
import { MultipartFile } from '@fastify/multipart'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'
const pump = util.promisify(pipeline)

export const uploadImage = async (data: MultipartFile) => {
  const uniqueId = randomId()
  const ext = path.extname(data.filename)
  const id = uniqueId + ext
  const filepath = path.resolve(envConfig.UPLOAD_FOLDER, id)
  await pump(data.file, fs.createWriteStream(filepath))
  if (data.file.truncated) {
    // Xóa file nếu file bị trucated
    await fs.unlinkSync(filepath)
    throw new Error('File size must be less than 10MB')
  }
  const url = `${API_URL}` + '/static/' + id
  return url
}
