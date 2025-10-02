import * as Sentry from '@sentry/node'
import envConfig from './config'

// Track initialization status
export let sentryInitialized = false

// Filter out integrations that use the global variable
const integrations = Sentry.getDefaultIntegrations({}).filter((defaultIntegration) => {
  return !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(defaultIntegration.name)
})

export function initSentry() {
  try {
    if (!process.env.SENTRY_DSN) {
      console.warn('SENTRY_DSN not provided, error tracking disabled')
      return false
    }

    Sentry.init({
      dsn: envConfig.SENTRY_DSN,
      environment: envConfig.NODE_ENV || 'development',
      release: envConfig.SENTRY_RELEASE || 'v1.0.0',

      // Adjust sample rates based on environment
      tracesSampleRate: envConfig.NODE_ENV === 'production' ? 0.2 : 1.0,
      profilesSampleRate: envConfig.NODE_ENV === 'production' ? 0.2 : 1.0,

      // GlitchTip compatibility - use standard integrations
      integrations: [...integrations],

      // Maximum breadcrumbs to capture
      maxBreadcrumbs: 50,

      // Optional: Add server name for identification
      serverName: envConfig.SERVER_NAME || 'qr-order-server',

      // Optional: Set maximum context size
      maxValueLength: 1000,

      // Optional: Debug mode for development
      debug: envConfig.NODE_ENV !== 'production'
    })

    sentryInitialized = true
    console.log('GlitchTip/Sentry initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize GlitchTip/Sentry:', error)
    sentryInitialized = false
    return false
  }
}

// Helper functions to use throughout the application
export const captureException = (error: Error) => {
  if (sentryInitialized) {
    Sentry.captureException(error)
  }
}

export const captureMessage = (message: string, level?: Sentry.SeverityLevel) => {
  if (sentryInitialized) {
    Sentry.captureMessage(message, level)
  }
}

export { Sentry }
