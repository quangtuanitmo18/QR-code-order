import { z } from 'zod'

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
  NEXT_PUBLIC_URL: z.string(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
  NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI: z.string()
})

const configProject = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI:
    process.env.NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI
})

if (!configProject.success) {
  console.error(configProject.error.errors)
  throw new Error('Các khai báo biến môi trường không hợp lệ')
}

const envConfig = configProject.data

export default envConfig

export type Locale = (typeof locales)[number]

export const locales = ['en', 'vi'] as const
export const defaultLocale: Locale = 'vi'
