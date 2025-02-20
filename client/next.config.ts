import NextBundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin()
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
        pathname: '/**'
      },
      {
        hostname: 'api-bigboy.duthanhduoc.com',
        pathname: '/**'
      },
      {
        hostname: 'via.placeholder.com',
        pathname: '/**'
      }
    ]
  }
}
const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})
export default withBundleAnalyzer(withNextIntl(nextConfig))
