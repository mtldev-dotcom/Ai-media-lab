import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AI Media Creation Workspace',
  description:
    'All-in-one AI media creation platform with transparent cost tracking. Generate images, videos, audio, and text from one project space.',
  keywords: ['AI', 'media', 'generation', 'images', 'videos', 'audio', 'text', 'OpenAI', 'Anthropic'],
  authors: [{ name: 'AI Media Lab' }],
  openGraph: {
    title: 'AI Media Creation Workspace',
    description: 'All-in-one AI media creation with transparent cost tracking',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
