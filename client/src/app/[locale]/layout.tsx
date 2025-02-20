import { Inter as FontSans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import AppProvider from '@/components/app-provider'
import { NextIntlClientProvider } from 'next-intl'
import {
  getMessages,
  getTranslations,
  setRequestLocale
} from 'next-intl/server'
import { Locale } from '@/config'
import NextTopLoader from 'nextjs-toploader'
import Footer from '@/components/footer'
import { baseOpenGraph } from '@/shared-metadata'
import GoogleTag from '@/components/google-tag'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})
export async function generateMetadata(props: {
  params: Promise<{ locale: Locale }>
}) {
  const params = await props.params

  const { locale } = params

  const t = await getTranslations({ locale, namespace: 'Brand' })
  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('defaultTitle')
    },
    openGraph: {
      ...baseOpenGraph
    }
    // other: {
    //   'google-site-verification': 'KKr5Sgn6rrXntMUp1nDIoQR7mJQujE4BExrlgcFvGTg'
    // }
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode
    params: Promise<{ locale: string }>
  }>
) {
  const params = await props.params

  const { locale } = params

  const { children } = props

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }
  setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <NextTopLoader showSpinner={false} color='hsl(var(--foreground))' />
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Footer />
              <Toaster />
            </ThemeProvider>
          </AppProvider>
        </NextIntlClientProvider>
        <GoogleTag />
      </body>
    </html>
  )
}
