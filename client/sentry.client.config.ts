import * as Sentry from "@sentry/nextjs";

console.log("Attempting to initialize Sentry...");
try {
  Sentry.init({
    // Your GlitchTip DSN
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance monitoring (adjust based on your needs)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Session replay (remove if not needed or not supported by GlitchTip)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Environment and release info
    environment: process.env.NODE_ENV || "development",
    release: process.env.NEXT_PUBLIC_RELEASE || "1.0.0",

    // Silence noisy logs
    debug: process.env.NODE_ENV !== "production",

    // Ignore some common errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      /^Network request failed/i,
    ],

    beforeSend(event) {
      // Don't send events in development
      // if (process.env.NODE_ENV !== "production") {
      //   return null;
      // }
      console.log("Sentry event:", event);
      return event;
    },
  });
  console.log("Sentry initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Sentry:", error);
}
