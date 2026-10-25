import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SENTINEL — AI Agent Command & Control',
  description:
    'Mission control dashboard for AI agents. Monitor, govern, and control autonomous AI agents in real time.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-sentinel-bg text-white antialiased font-sans min-h-screen">
        <Sidebar />
        {/* Main content offset by sidebar width */}
        <main className="ml-60 min-h-screen">{children}</main>
      </body>
    </html>
  )
}
