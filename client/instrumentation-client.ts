import envConfig from "@/config";
import * as Sentry from "@sentry/nextjs";
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
Sentry.init({
  dsn: envConfig.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: "system",
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});
