import envConfig from '@/config'
import * as Sentry from '@sentry/nextjs'
const SENTRY_ENABLED =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true' && process.env.NODE_ENV === 'production'

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: envConfig.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enableLogs: process.env.NODE_ENV === 'development' ? true : false,
  })
}
