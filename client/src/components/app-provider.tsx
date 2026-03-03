'use client'
import { GlobalChatNotification } from '@/components/chat/global-chat-notification'
import ListenLogoutSocket from '@/components/listen-logout-socket'
import RefreshToken from '@/components/refresh-token'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { ViewportProvider } from '@/hooks/useViewport'
import { useVisibility } from '@/hooks/useVisibility'
import { decodeToken, generateSocketInstace, getAccessTokenFromLocalStorage } from '@/lib/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

const CallModal = dynamic(() => import('@/components/call/CallModal').then((m) => m.CallModal), {
  ssr: false,
})
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
  { ssr: false }
)

// Default
// staleTime: 0
// gc: 5 phút (5 * 1000* 60)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000, // 1s — prevents duplicate fetches on rapid navigation
    },
  },
})
// const AppContext = createContext({
//   isAuth: false,
//   role: undefined as RoleType | undefined,
//   setRole: (role?: RoleType | undefined) => {},
//   socket: undefined as Socket | undefined,
//   setSocket: (socket?: Socket | undefined) => {},
//   disconnectSocket: () => {}
// })

import { useAppStore } from '@/store/useAppStore'

// export const useAppContext = () => {
//   return useContext(AppContext)
// }
export default function AppProvider({ children }: { children: React.ReactNode }) {
  const setRole = useAppStore((state) => state.setRole)
  const setSocket = useAppStore((state) => state.setSocket)
  // const [socket, setSocket] = useState<Socket | undefined>()
  const count = useRef(0)

  useEffect(() => {
    if (count.current === 0) {
      const accessToken = getAccessTokenFromLocalStorage()
      if (accessToken) {
        const role = decodeToken(accessToken).role
        setRole(role)
        setSocket(generateSocketInstace(accessToken))
      }
      count.current++
    }
  }, [setRole, setSocket])

  // const disconnectSocket = useCallback(() => {
  //   socket?.disconnect()
  //   setSocket(undefined)
  // }, [socket, setSocket])

  // Các bạn nào mà dùng Next.js 15 và React 19 thì không cần dùng useCallback đoạn này cũng được
  // const setRole = useCallback((role?: RoleType | undefined) => {
  //   setRoleState(role)
  //   if (!role) {
  //     removeTokensFromLocalStorage()
  //   }
  // }, [])
  // const isAuth = Boolean(role)
  // Nếu mọi người dùng React 19 và Next.js 15 thì không cần AppContext.Provider, chỉ cần AppContext là đủ
  usePushNotifications()
  useVisibility()

  return (
    // <AppContext.Provider
    //   value={{ role, setRole, isAuth, socket, setSocket, disconnectSocket }}
    // >
    <QueryClientProvider client={queryClient}>
      <ViewportProvider>
        {children}
        <CallModal />
        <GlobalChatNotification />
        <RefreshToken />
        <ListenLogoutSocket />
        <ReactQueryDevtools initialIsOpen={false} />
      </ViewportProvider>
    </QueryClientProvider>
    // </AppContext.Provider>
  )
}
