import envConfig from "@/config";
import NextBundleAnalyzer from "@next/bundle-analyzer";
import { SentryBuildOptions, withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isCI = process.env.CI === "true";

const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "localhost",
        pathname: "/**",
      },
      {
        hostname: "127.0.0.1",
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
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self';",
  },
  output: "standalone",
  productionBrowserSourceMaps: false,

  experimental: {},
  // Add the new turbopack configuration
  turbopack: {},
};

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Rest of your configuration remains the same
const sentryWebpackPluginOptions: SentryBuildOptions = {
  authToken: envConfig.SENTRY_AUTH_TOKEN,
  org: envConfig.SENTRY_ORG,
  project: envConfig.SENTRY_PROJECT,

  release: envConfig.NEXT_PUBLIC_RELEASE
    ? { name: envConfig.NEXT_PUBLIC_RELEASE }
    : undefined,
  sourcemaps: {
    disable: true,
    assets: ["**/*.js", "**/*.js.map"],
    ignore: ["**/node_modules/**"],
    deleteSourcemapsAfterUpload: false,
  },
  silent: true,
};

export default withSentryConfig(
  withBundleAnalyzer(withNextIntl(nextConfig)),
  sentryWebpackPluginOptions
);
