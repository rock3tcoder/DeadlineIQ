import type { CapacitorConfig } from '@capacitor/cli'

// DeadlineIQ Mobile — native iOS/Android shell around the deployed web app.
// Auth, billing, and data live server-side, so the native WebView loads the
// production site. Override with DEADLINEIQ_URL at sync time for staging.
const config: CapacitorConfig = {
  appId: 'com.deadlineiq.app',
  appName: 'DeadlineIQ',
  webDir: 'www',
  backgroundColor: '#020617',
  server: {
    url: process.env.DEADLINEIQ_URL ?? 'https://deadlineiq.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
