import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // happy-dom handles ESM natively, fixing ERR_REQUIRE_ESM from @csstools/* packages
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Exclude Playwright E2E tests — they run via `playwright test`, not vitest
    exclude: ['node_modules', 'e2e/**', '**/*.spec.ts'],
    // Provide mock env vars so src/config.ts doesn't throw during test
    env: {
      NEXT_PUBLIC_API_ENDPOINT: 'http://localhost:4000',
      NEXT_PUBLIC_URL: 'http://localhost:3000',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'test-google-client-id',
      NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI: 'http://localhost:3000/api/auth/google',
      NEXT_PUBLIC_WS_ORIGIN: 'http://localhost:4000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/types/**',
        'src/constants/**',
        'src/**/index.ts',
      ],
    },
  },
  resolve: {
    alias: [
      // IMPORTANT: More-specific aliases must come before the general '@' alias
      // because Vite uses first-match-wins for alias resolution
      //
      // Stub @/i18n/routing to avoid next-intl/navigation import
      {
        find: /^@\/i18n\/routing$/,
        replacement: path.resolve(__dirname, './src/test/__mocks__/routing.ts'),
      },
      // Stub ALL next-intl/* subpaths (routing, navigation, server, etc.)
      {
        find: /^next-intl\/.*/,
        replacement: path.resolve(__dirname, './src/test/__mocks__/next-intl.tsx'),
      },
      // Stub next-intl (base import)
      {
        find: 'next-intl',
        replacement: path.resolve(__dirname, './src/test/__mocks__/next-intl.tsx'),
      },
      // @/ base alias — must come AFTER specific overrides above
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
})
