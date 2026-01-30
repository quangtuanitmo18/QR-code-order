import envConfig from '@/config'
import * as Sentry from '@sentry/nextjs'

export const onRequestError = Sentry.captureRequestError
const SENTRY_ENABLED =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true' && process.env.NODE_ENV === 'production'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: envConfig.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.replayIntegration(),
      Sentry.feedbackIntegration({
        colorScheme: 'system',
      }),
    ],
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enableLogs: process.env.NODE_ENV === 'development' ? true : false,
  })
}
