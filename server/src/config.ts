import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import z from 'zod'

config({
  path: '.env'
})

const checkEnv = async () => {
  const chalk = (await import('chalk')).default
  if (!fs.existsSync(path.resolve('.env'))) {
    console.log(chalk.red(`don't have .env`))
    process.exit(1)
  }
}
checkEnv()

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  GUEST_ACCESS_TOKEN_EXPIRES_IN: z.string(),
  GUEST_REFRESH_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  INITIAL_EMAIL_OWNER: z.string(),
  INITIAL_PASSWORD_OWNER: z.string(),
  DOMAIN: z.string(),
  PROTOCOL: z.string(),
  UPLOAD_FOLDER: z.string(),
  CLIENT_URL: z.string(),
  GOOGLE_REDIRECT_CLIENT_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_AUTHORIZED_REDIRECT_URI: z.string(),
  PRODUCTION: z.enum(['true', 'false']).transform((val) => val === 'true'),
  DOCKER: z.enum(['true', 'false']).transform((val) => val === 'true'),
  PRODUCTION_URL: z.string(),
  SERVER_TIMEZONE: z.string(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  SENTRY_DSN: z.string(),
  SENTRY_RELEASE: z.string(),
  SERVER_NAME: z.string()
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.error(configServer.error.issues)
  throw new Error('Invalid environment variables')
}
const envConfig = configServer.data
export const API_URL = envConfig.PRODUCTION
  ? envConfig.PRODUCTION_URL
  : `${envConfig.PROTOCOL}://${envConfig.DOMAIN}:${envConfig.PORT}`
export default envConfig

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof configSchema> {}
  }
}
