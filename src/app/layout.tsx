import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MessagingProvider } from '@/contexts/MessagingContext'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { NotificationGenerator } from '@/components/notifications/NotificationGenerator'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppInitializer } from '@/components/AppInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lenkersdorfer CRM - Luxury Watch Sales',
  description: 'Professional CRM for luxury watch sales and client management',
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <AppInitializer>
                <NotificationProvider>
                  <MessagingProvider>
                    <NotificationGenerator />
                    <div className="min-h-screen bg-background text-foreground">
                      {children}
                    </div>
                  </MessagingProvider>
                </NotificationProvider>
              </AppInitializer>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}