'use client'

import { ToastAction } from '@/components/ui/toast'
import { toast } from '@/components/ui/use-toast'
import { useAppStore } from '@/store/useAppStore'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function GlobalChatNotification() {
  const socket = useAppStore((state) => state.socket)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!socket) return

    const handleGlobalNewMessage = (data: { conversationId: number; message: any }) => {
      const { conversationId, message } = data
      
      // Nếu đang ở trang chat thì không hiện popup nữa vì giao diện chat đã tự xử lý
      if (pathname?.includes('/manage/chat')) {
        return
      }

      const senderName = message.sender?.name || 'Someone'
      const contentPreview = message.content 
        ? (message.content.length > 40 ? message.content.substring(0, 40) + '...' : message.content)
        : 'Sent a file'

      toast({
        title: `New message from ${senderName}`,
        description: contentPreview,
        action: (
          <ToastAction
            altText="View"
            onClick={() => {
              // Extract current locale from pathname to keep routing correct
              const localeMatch = pathname?.match(/^\/([a-z]{2})\//)
              const locale = localeMatch ? localeMatch[1] : 'en' // fallback
              router.push(`/${locale}/manage/chat?conversationId=${conversationId}`)
            }}
          >
            View
          </ToastAction>
        ),
      })
    }

    socket.on('new-message', handleGlobalNewMessage)

    return () => {
      socket.off('new-message', handleGlobalNewMessage)
    }
  }, [socket, pathname, router])

  return null
}
