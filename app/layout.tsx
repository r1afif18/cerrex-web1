import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CerrexProvider } from '@/lib/context/CerrexContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CERREX Web - Nuclear Decommissioning Cost Estimation',
  description: 'Modern web application for nuclear decommissioning cost estimation based on ISDC methodology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CerrexProvider>
          {children}
        </CerrexProvider>
      </body>
    </html>
  )
}
