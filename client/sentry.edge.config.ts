import envConfig from "@/config";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: envConfig.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  enableLogs: true,
});
