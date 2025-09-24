import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ThemeProvider } from '@/components/ui/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lenkersdorfer CRM - Luxury Watch Sales',
  description: 'Professional CRM for luxury watch sales and client management',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>
            <div className="min-h-screen bg-background text-foreground">
              {children}
            </div>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}