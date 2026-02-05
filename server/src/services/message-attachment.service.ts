import envConfig, { API_URL } from '@/config'
import prisma from '@/database'
import { EntityError } from '@/utils/errors'
import { randomId } from '@/utils/helpers'
import { MultipartFile } from '@fastify/multipart'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'

const pump = util.promisify(pipeline)

// Create chat upload directory if it doesn't exist
const CHAT_UPLOAD_DIR = path.resolve(envConfig.UPLOAD_FOLDER, 'chat')
if (!fs.existsSync(CHAT_UPLOAD_DIR)) {
  fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true })
}

// File type validation (same as task attachments)
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

// Dangerous file extensions to block
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

// Extension to MIME type mapping
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

export const messageAttachmentService = {
  /**
   * Upload and create attachment for a message
   */
  async createAttachment(data: { messageId: number; file: MultipartFile }) {
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
        // MIME type doesn't match extension - log warning but allow
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
    const fullPath = path.resolve(CHAT_UPLOAD_DIR, filePath)
    await pump(data.file.file, fs.createWriteStream(fullPath))

    // Check if file was truncated
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

    // Double-check file size after write
    if (fileSize > MAX_FILE_SIZE) {
      // Delete oversized file
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
      }
      throw new EntityError([{ field: 'file', message: 'File size must be less than 10MB' }])
    }

    // Determine final MIME type for storage
    const finalMimeType =
      providedMimeType === 'application/octet-stream'
        ? EXTENSION_TO_MIME[ext] || 'application/octet-stream'
        : providedMimeType

    // Create attachment record
    const attachment = await prisma.messageAttachment.create({
      data: {
        messageId: data.messageId,
        fileName,
        filePath,
        fileSize,
        mimeType: finalMimeType
      }
    })

    return {
      ...attachment,
      fileUrl: API_URL + `/static/chat/${attachment.filePath}`
    }
  },

  /**
   * Get attachments for a message
   */
  async getAttachmentsByMessageId(messageId: number) {
    const attachments = await prisma.messageAttachment.findMany({
      where: { messageId }
    })

    // Add fileUrl to each attachment
    return attachments.map((attachment) => ({
      ...attachment,
      fileUrl: API_URL + `/static/chat/${attachment.filePath}`
    }))
  },

  /**
   * Delete attachment (and physical file)
   */
  async deleteAttachment(id: number) {
    // Check if attachment exists
    const attachment = await prisma.messageAttachment.findUnique({
      where: { id }
    })

    if (!attachment) {
      throw new EntityError([{ field: 'id', message: 'Attachment not found' }])
    }

    // Delete physical file
    const filePath = path.resolve(CHAT_UPLOAD_DIR, attachment.filePath)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }

    // Delete database record
    await prisma.messageAttachment.delete({
      where: { id }
    })

    return { success: true }
  }
}
