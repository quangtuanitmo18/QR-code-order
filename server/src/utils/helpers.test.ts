import { createFolder, randomId } from '@/utils/helpers'
import fs from 'fs'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

describe('Helper utilities', () => {
  describe('randomId', () => {
    it('returns a 32-character hex string', () => {
      const id = randomId()
      expect(id).toHaveLength(32)
      expect(id).toMatch(/^[0-9a-f]{32}$/)
    })

    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 50 }, () => randomId()))
      expect(ids.size).toBe(50)
    })
  })

  describe('createFolder', () => {
    const testDir = path.join('/tmp', `test-helpers-${Date.now()}`)

    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true })
      }
    })

    it('creates a directory if it does not exist', () => {
      createFolder(testDir)
      expect(fs.existsSync(testDir)).toBe(true)
    })

    it('does not throw if directory already exists', () => {
      createFolder(testDir)
      expect(() => createFolder(testDir)).not.toThrow()
    })

    it('creates nested directories recursively', () => {
      const nested = path.join(testDir, 'a', 'b', 'c')
      createFolder(nested)
      expect(fs.existsSync(nested)).toBe(true)
    })
  })
})
