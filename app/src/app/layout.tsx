import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Auto Clip — Viral Short-Form Content Generator',
  description:
    'Pipeline otomatis berbasis AI untuk mengubah video panjang menjadi konten viral TikTok, Reels, dan YouTube Shorts.',
  keywords: ['AI', 'video', 'clip', 'short-form', 'viral', 'TikTok', 'YouTube Shorts', 'Gemini'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
