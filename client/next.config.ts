import NextBundleAnalyzer from "@next/bundle-analyzer";
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
};
const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
export default withBundleAnalyzer(withNextIntl(nextConfig));
