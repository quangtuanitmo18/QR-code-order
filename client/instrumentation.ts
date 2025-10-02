import * as Sentry from "@sentry/nextjs";
export const onRequestError = Sentry.captureRequestError;
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
