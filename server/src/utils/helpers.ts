import fs from 'fs'
import crypto from 'crypto'

export const randomId = () => crypto.randomUUID().replace(/-/g, '')
export const createFolder = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
}

export const getChalk = async () => {
  const chalk = (await import('chalk')).default
  return chalk
}
