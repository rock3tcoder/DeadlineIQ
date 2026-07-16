import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {
    // Allow the scraper's raw content field to be large
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Load src/instrumentation.ts (Sentry server/edge init)
    instrumentationHook: true,
  },
}

// Only wrap with Sentry when a DSN is configured — keeps builds
// working out of the box without Sentry credentials.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      // Source map upload only happens when SENTRY_AUTH_TOKEN is set
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    })
  : nextConfig
