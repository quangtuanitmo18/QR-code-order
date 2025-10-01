import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Your GlitchTip DSN
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance sampling
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Environment and release info
  environment: process.env.NODE_ENV || "development",
  release: process.env.NEXT_PUBLIC_RELEASE || "1.0.0",

  // Silence noisy logs
  debug: process.env.NODE_ENV !== "production",

  // Source map configuration
  attachStacktrace: true,

  // Alternative GlitchTip server URL if needed (if different from DSN)
  serverName: process.env.HOSTNAME || "qr-order-client",

  // Don't send events in development
  beforeSend(event) {
    // if (process.env.NODE_ENV !== "production") {
    //   return null;
    // }
    return event;
  },
});
