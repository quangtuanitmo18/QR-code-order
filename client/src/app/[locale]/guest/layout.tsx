import Layout from '@/app/[locale]/(public)/layout'
import { defaultLocale } from '@/config'

export default function GuestLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Layout modal={null} params={Promise.resolve({ locale: defaultLocale })}>
      {children}
    </Layout>
  )
}
