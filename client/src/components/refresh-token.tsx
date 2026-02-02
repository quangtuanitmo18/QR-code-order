'use client'

import { useAppStore } from '@/components/app-provider'
import { usePathname, useRouter } from '@/i18n/routing'
import { checkAndRefreshToken } from '@/lib/utils'
import { useEffect } from 'react'

// Những page sau sẽ không check refesh token
const UNAUTHENTICATED_PATH = ['/manage/login', '/logout', '/manage/refresh-token']
export default function RefreshToken() {
  const pathname = usePathname()
  const router = useRouter()
  const socket = useAppStore((state) => state.socket)
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return
    let interval: any = null
    // Phải gọi lần đầu tiên, vì interval sẽ chạy sau thời gian TIMEOUT
    const onRefreshToken = (force?: boolean) => {
     
      checkAndRefreshToken({
        onError: () => {
          console.error('[RefreshToken] ❌ Refresh token failed - redirecting to login', {
            pathname,
            timestamp: new Date().toISOString(),
          })
          clearInterval(interval)
          disconnectSocket()
          router.push('/manage/login')
        },
        onSuccess: () => {
          console.log('[RefreshToken] ✅ Token refreshed successfully', {
            pathname,
            timestamp: new Date().toISOString(),
          })
        },
        force,
      })
    }

    onRefreshToken()
    // Timeout interval phải bé hơn thời gian hết hạn của access token
    // Ví dụ thời gian hết hạn access token là 10s thì 1s mình sẽ cho check 1 lần
    const TIMEOUT = 1000
    interval = setInterval(onRefreshToken, TIMEOUT)

    if (socket?.connected) {
      onConnect()
    }

    function onConnect() {
      console.log(socket?.id)
    }

    function onDisconnect() {
      console.log('disconnect')
    }

    function onRefreshTokenSocket() {
      console.log('[RefreshToken] 🔔 Received refresh-token event from socket')
      onRefreshToken(true)
    }
    socket?.on('connect', onConnect)
    socket?.on('disconnect', onDisconnect)
    socket?.on('refresh-token', onRefreshTokenSocket)
    return () => {
      clearInterval(interval)
      socket?.off('connect', onConnect)
      socket?.off('disconnect', onDisconnect)
      socket?.off('refresh-token', onRefreshTokenSocket)
    }
  }, [pathname, router, socket, disconnectSocket])
  return null
}
