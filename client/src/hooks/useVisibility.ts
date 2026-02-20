import { useAppStore } from '@/store/useAppStore'
import { useEffect, useRef } from 'react'

export const useVisibility = () => {
  const isAuth = useAppStore(state => state.isAuth)
  const socket = useAppStore(state => state.socket)
  const isFocusedRef = useRef(typeof document !== 'undefined' ? !document.hidden : true)

  useEffect(() => {
    if (!isAuth) return

    const handleVisibilityChange = () => {
      const isFocused = !document.hidden
      
      // Only emit if state actually changed
      if (isFocused !== isFocusedRef.current) {
        isFocusedRef.current = isFocused
        
        // Let the server know if we are active or in the background
        if (socket?.connected) {
          socket.emit('client-visibility', { isFocused })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuth, socket])

  return isFocusedRef.current
}
