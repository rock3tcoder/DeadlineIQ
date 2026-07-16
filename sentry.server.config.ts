// Sentry — Node.js server-side error monitoring.
// No-ops when NEXT_PUBLIC_SENTRY_DSN is not set.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})
