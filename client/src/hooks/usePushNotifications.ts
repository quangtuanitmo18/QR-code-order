import fcmApiRequest from '@/apiRequests/fcm'
import { Role } from '@/constants/type'
import { messaging } from '@/lib/firebase'
import { useAppStore } from '@/store/useAppStore'
import { getToken, onMessage } from '@firebase/messaging'
import { useEffect, useRef, useState } from 'react'

export const usePushNotifications = () => {
  const isAuth = useAppStore((state) => state.isAuth)
  const role = useAppStore((state) => state.role)
  const isSyncing = useRef(false)
  const [fcmToken, setFcmToken] = useState<string | null>(null)

  useEffect(() => {
    // Only register push notifications for logged-in accounts (Owner/Employee), NOT guests
    if (!isAuth || role === Role.Guest || isSyncing.current) return

    const requestPermissionAndRegister = async () => {
      try {
        isSyncing.current = true
        // 1. Check if the browser supports notifications
        if (!('Notification' in window)) {
          console.log('This browser does not support desktop notification')
          return
        }

        // 2. Request permission if not already granted
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          console.log('Notification permission not granted.')
          return
        }

        // 3. Get the messaging instance
        const m = await messaging()
        if (!m) return // Not supported/HTTPS

        // 4. Get the token from Firebase
        // NOTE: The vapidKey is required to generate the token
        const token = await getToken(m, {
          vapidKey:
            'BGTchPR_Xr8OIB7TgwXg7BEOmPgXRFDWMtoPIEzMEtZQeGV92EM5143_KASO9CwAnP7RF4wAUOkHTIcVBwk4-aU',
        })

        if (token) {
          setFcmToken(token)
          // 5. Send this token to the backend server to associate it with the active user account
          await fcmApiRequest.registerToken({
            token,
            deviceType: 'web',
          })
          console.log('FCM Token successfully synced with backend.')
        } else {
          console.log('No registration token available. Request permission to generate one.')
        }
      } catch (error) {
        console.error('[usePushNotifications] Error syncing token:', error)
      } finally {
        isSyncing.current = false
      }
    }

    requestPermissionAndRegister()
  }, [isAuth, role])

  // Optional: You can also handle foreground messages here if you want overlapping functionality,
  // though for chat/calls we strictly use Socket.IO when the app is in the foreground.
  useEffect(() => {
    if (!isAuth || role === Role.Guest) return

    let unsubscribe: any
    messaging().then((m) => {
      if (m) {
        // Firebase foreground message handler
        unsubscribe = onMessage(m, (payload) => {
          console.log(
            '[usePushNotifications] Foreground message received. Ignoring in favor of WebSocket.',
            payload
          )
        })
      }
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [isAuth, role])

  return { fcmToken }
}
