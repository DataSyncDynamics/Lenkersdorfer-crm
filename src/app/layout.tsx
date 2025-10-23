import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
      <head>
        <Script id="theme-loader" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const storageKey = 'ui-theme';
                const theme = localStorage.getItem(storageKey);
                const root = document.documentElement;

                root.classList.remove('light', 'dark');

                if (!theme) {
                  // Default to dark mode if no preference is set
                  root.classList.add('dark');
                } else if (theme === 'system') {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  root.classList.add(systemTheme);
                } else if (theme === 'light' || theme === 'dark') {
                  root.classList.add(theme);
                } else {
                  root.classList.add('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            })();
          `}
        </Script>
      </head>
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