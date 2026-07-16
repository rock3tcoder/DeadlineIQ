import type { MetadataRoute } from 'next'

// Web app manifest — makes DeadlineIQ installable as an app on
// desktop (Chrome/Edge "Install app") and mobile ("Add to Home Screen").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DeadlineIQ — Policy & Tax Deadline Intelligence',
    short_name: 'DeadlineIQ',
    description:
      'AI-powered monitoring of platform policy changes and tax filing deadlines for e-commerce sellers and SMBs.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#0f172a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
