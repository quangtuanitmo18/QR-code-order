import Layout from '@/app/[locale]/(public)/layout'
import AiChatButton from '@/components/ai-chat/ai-chat-button'
import { defaultLocale } from '@/config'

export default function GuestLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Layout modal={null} params={Promise.resolve({ locale: defaultLocale })}>
      <div className="h-[70vh]">{children}</div>
      <AiChatButton />
    </Layout>
  )
}
