'use client'

import { useRouter } from '@/i18n/routing'
import { getAccessTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { useAppStore } from '@/store/useAppStore'
import { useSearchParams } from 'next/navigation'
import { memo, Suspense, useEffect, useRef } from 'react'

function LogoutComponent() {
  const { mutateAsync } = useLogoutMutation()
  const router = useRouter()
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)
  const setRole = useAppStore((state) => state.setRole)
  const searchParams = useSearchParams()
  const refreshTokenFromUrl = searchParams.get('refreshToken')
  const accessTokenFromUrl = searchParams.get('accessToken')
  const ref = useRef<any>(null)
  useEffect(() => {
    if (
      !ref.current &&
      ((refreshTokenFromUrl && refreshTokenFromUrl === getRefreshTokenFromLocalStorage()) ||
        (accessTokenFromUrl && accessTokenFromUrl === getAccessTokenFromLocalStorage()))
    ) {
      ref.current = mutateAsync
      mutateAsync().then((res) => {
        setTimeout(() => {
          ref.current = null
        }, 1000)
        setRole()
        disconnectSocket()
      })
    } else if (accessTokenFromUrl !== getAccessTokenFromLocalStorage()) {
      router.push('/')
    }
  }, [mutateAsync, router, refreshTokenFromUrl, accessTokenFromUrl, setRole, disconnectSocket])
  return null
}

const Logout = memo(function LogoutInner() {
  return (
    <Suspense fallback={null}>
      <LogoutComponent />
    </Suspense>
  )
})

export default Logout
