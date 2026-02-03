import envConfig from '@/config'
import prisma from '@/database'
import { taskAttachmentRepository } from '@/repositories/task-attachment.repository'
import { EntityError } from '@/utils/errors'
import { randomId } from '@/utils/helpers'
import { MultipartFile } from '@fastify/multipart'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'

const pump = util.promisify(pipeline)

// Create tasks upload directory if it doesn't exist
const TASKS_UPLOAD_DIR = path.resolve(envConfig.UPLOAD_FOLDER, 'tasks')
if (!fs.existsSync(TASKS_UPLOAD_DIR)) {
  fs.mkdirSync(TASKS_UPLOAD_DIR, { recursive: true })
}

// File type validation
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // Text
  'text/plain',
  'text/csv',
  'text/markdown',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Other common types
  'application/json',
  'application/xml'
]

// Dangerous file extensions to block (executable, script, and code files)
const DANGEROUS_EXTENSIONS = [
  // Executables
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.ps1',
  '.app',
  '.dmg',
  '.deb',
  '.rpm',
  '.msi',
  // Scripts and code files
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.php',
  '.py',
  '.rb',
  '.pl',
  // Archives that could contain executables
  '.jar',
  '.war',
  '.ear',
  // Other potentially dangerous
  '.dll',
  '.so',
  '.dylib'
]

// Extension to MIME type mapping for validation when MIME type is not provided or is application/octet-stream
const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  // Other
  '.json': 'application/json',
  '.xml': 'application/xml'
}

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export const taskAttachmentService = {
  /**
   * Get all attachments for a task
   */
  async getAttachmentsByTaskId(taskId: number) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      throw new EntityError([{ field: 'taskId', message: 'Task not found' }])
    }

    const attachments = await taskAttachmentRepository.findByTaskId(taskId)

    // Add fileUrl to each attachment
    return attachments.map((attachment) => ({
      ...attachment,
      fileUrl: `/static/tasks/${attachment.filePath}`
    }))
  },

  /**
   * Upload and create attachment
   */
  async createAttachment(data: { taskId: number; file: MultipartFile; uploadedById: number }) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId }
    })

    if (!task) {
      throw new EntityError([{ field: 'taskId', message: 'Task not found' }])
    }

    // Validate file
    if (!data.file) {
      throw new EntityError([{ field: 'file', message: 'File is required' }])
    }

    // Validate file extension (check for dangerous extensions)
    const originalFilename = data.file.filename || ''
    const ext = path.extname(originalFilename).toLowerCase()

    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      throw new EntityError([
        { field: 'file', message: `File type not allowed. Dangerous file extensions are blocked.` }
      ])
    }

    // Validate MIME type
    const providedMimeType = data.file.mimetype || 'application/octet-stream'
    const expectedMimeType = EXTENSION_TO_MIME[ext]

    // If MIME type is application/octet-stream or not provided, validate based on extension
    if (providedMimeType === 'application/octet-stream' || !providedMimeType) {
      // Check if extension has a known MIME type mapping
      if (!expectedMimeType) {
        // Extension not in whitelist - reject
        throw new EntityError([
          { field: 'file', message: `File type not allowed. Unknown file extension or MIME type.` }
        ])
      }
      // Extension is in whitelist, use the mapped MIME type for storage
      // (We'll use expectedMimeType when saving to DB)
    } else {
      // MIME type is provided and not application/octet-stream - validate against whitelist
      if (!ALLOWED_MIME_TYPES.includes(providedMimeType)) {
        throw new EntityError([
          {
            field: 'file',
            message: `File type not allowed. Allowed types: images, documents, text files, and archives.`
          }
        ])
      }

      // Additional security: If extension is not in whitelist but MIME type is provided,
      // still reject to prevent bypassing extension validation
      if (!expectedMimeType) {
        throw new EntityError([{ field: 'file', message: `File type not allowed. Unknown file extension.` }])
      }

      // Optional: Verify MIME type matches extension (defense in depth)
      if (expectedMimeType !== providedMimeType) {
        // MIME type doesn't match extension - this could be suspicious but not necessarily malicious
        // Log warning but allow (some browsers/systems may send incorrect MIME types)
        console.warn(
          `MIME type mismatch: extension ${ext} suggests ${expectedMimeType}, but received ${providedMimeType}`
        )
      }
    }

    // Sanitize filename - use basename to remove any directory components
    const sanitizedFileName = path.basename(originalFilename) || `file${ext}`

    // Generate unique filename
    const uniqueId = randomId()
    const fileName = sanitizedFileName
    const filePath = `${uniqueId}${ext}`

    // Save file to disk
    const fullPath = path.resolve(TASKS_UPLOAD_DIR, filePath)
    await pump(data.file.file, fs.createWriteStream(fullPath))

    // Check if file was truncated (Fastify multipart limits already enforced, but verify)
    if (data.file.file.truncated) {
      // Delete file if truncated
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
      }
      throw new EntityError([{ field: 'file', message: 'File size must be less than 10MB' }])
    }

    // Get file stats and validate final size
    const stats = await fs.promises.stat(fullPath)
    const fileSize = stats.size

    // Double-check file size after write (in case truncated flag wasn't set)
    if (fileSize > MAX_FILE_SIZE) {
      // Delete oversized file
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
      }
      throw new EntityError([{ field: 'file', message: 'File size must be less than 10MB' }])
    }

    // Determine final MIME type for storage
    // If provided MIME type was application/octet-stream, use the mapped MIME type from extension
    const finalMimeType =
      providedMimeType === 'application/octet-stream'
        ? EXTENSION_TO_MIME[ext] || 'application/octet-stream'
        : providedMimeType

    // Create attachment record
    const attachment = await taskAttachmentRepository.create({
      taskId: data.taskId,
      fileName,
      filePath,
      fileSize,
      mimeType: finalMimeType,
      uploadedById: data.uploadedById
    })

    return {
      ...attachment,
      fileUrl: `/static/tasks/${attachment.filePath}`
    }
  },

  /**
   * Delete attachment
   */
  async deleteAttachment(id: number, userId: number) {
    // Check if attachment exists
    const attachment = await taskAttachmentRepository.findById(id)
    if (!attachment) {
      throw new EntityError([{ field: 'id', message: 'Attachment not found' }])
    }

    // Check if user is the uploader
    if (attachment.uploadedById !== userId) {
      throw new EntityError([{ field: 'id', message: 'You can only delete your own attachments' }])
    }

    // Delete physical file
    const filePath = path.resolve(TASKS_UPLOAD_DIR, attachment.filePath)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }

    // Delete database record
    const deleted = await taskAttachmentRepository.delete(id)
    if (!deleted) {
      throw new EntityError([{ field: 'id', message: 'Failed to delete attachment' }])
    }

    return { success: true }
  }
}
