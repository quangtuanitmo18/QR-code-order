import { useAppStore } from '@/components/app-provider'
import { usePathname, useRouter } from '@/i18n/routing'
import { handleErrorApi } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { useEffect } from 'react'

const UNAUTHENTICATED_PATH = ['/manage/login', '/logout', '/manage/refresh-token']
export default function ListenLogoutSocket() {
  const pathname = usePathname()
  const router = useRouter()
  const { isPending, mutateAsync } = useLogoutMutation()
  const setRole = useAppStore((state) => state.setRole)
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)
  const socket = useAppStore((state) => state.socket)
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return
    async function onLogout() {
      console.log('[ListenLogoutSocket] 🔔 Received logout event from socket', {
        pathname,
        isPending,
        timestamp: new Date().toISOString(),
      })
      if (isPending) {
        console.log('[ListenLogoutSocket] ⏳ Logout already in progress, skipping')
        return
      }
      try {
        console.log('[ListenLogoutSocket] 📤 Calling logout mutation...')
        await mutateAsync()
        setRole()
        disconnectSocket()
        console.log('[ListenLogoutSocket] ✅ Logout successful, redirecting to home')
        router.push('/')
      } catch (error: any) {
        console.error('[ListenLogoutSocket] ❌ Logout error:', error)
        handleErrorApi({
          error,
        })
      }
    }
    socket?.on('logout', onLogout)
    console.log('[ListenLogoutSocket] 👂 Listening for logout events', { pathname })
    return () => {
      socket?.off('logout', onLogout)
      console.log('[ListenLogoutSocket] 🔇 Stopped listening for logout events')
    }
  }, [socket, pathname, setRole, router, isPending, mutateAsync, disconnectSocket])
  return null
}
