import { config } from 'dotenv'
import path from 'path'
import { defineConfig } from 'vitest/config'

// Load .env.test BEFORE Vitest starts
config({ path: path.resolve(__dirname, '.env.test'), override: true })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/test/global-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/type.d.ts']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
