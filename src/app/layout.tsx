import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'DeadlineIQ — Policy & Tax Deadline Intelligence',
  description:
    'AI-powered monitoring of platform policy changes and tax filing deadlines for e-commerce sellers and SMBs.',
  openGraph: {
    title: 'DeadlineIQ — Policy & Tax Deadline Intelligence',
    description: 'AI-powered monitoring of policy changes and tax deadlines for e-commerce sellers and SMBs.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
