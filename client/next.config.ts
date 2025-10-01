import NextBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "localhost",
        pathname: "/**",
      },
      {
        hostname: "api-bigboy.duthanhduoc.com",
        pathname: "/**",
      },
      {
        hostname: "164181.msk.web.highserver.ru",
        pathname: "/**",
      },
      {
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
    ],
  },
  sentry: {
    // Hide source maps from end users
    hideSourceMaps: true,

    // Don't upload source maps in development
    disableServerWebpackPlugin: process.env.NODE_ENV !== "production",
    disableClientWebpackPlugin: process.env.NODE_ENV !== "production",
  },
};
const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const sentryWebpackPluginOptions = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  release: process.env.NEXT_PUBLIC_RELEASE
    ? { name: process.env.NEXT_PUBLIC_RELEASE }
    : undefined,
  sourcemaps: {
    deleteSourcemapsAfterUpload: false,
  },
  disableUpload: process.env.NODE_ENV !== "production",
  url: process.env.SENTRY_URL, // Adjust to your GlitchTip URL

  silent: true,
};

export default withSentryConfig(
  withBundleAnalyzer(withNextIntl(nextConfig)),
  sentryWebpackPluginOptions
);
