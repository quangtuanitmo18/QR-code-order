importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: "AIzaSyBnEKN2v2qz2RJWp2wtZkJoJ-FhAj90eeo",
  authDomain: "qr-coder-code.firebaseapp.com",
  projectId: "qr-coder-code",
  storageBucket: "qr-coder-code.firebasestorage.app",
  messagingSenderId: "201344117976",
  appId: "1:201344117976:web:893aebeb332b1ede78bbad",
  measurementId: "G-JL9MYW5BQF"
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// This event listener executes when the browser is in the background or closed
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)

  // Handle Silent Data payloads (e.g. Call Cancelled)
  if (payload.data?.type === 'CALL_CANCELLED') {
    return self.registration.getNotifications().then((notifications) => {
      notifications.forEach((notification) => {
        // Find the specific call notification and close it
        if (notification.data?.conversationId === payload.data?.conversationId) {
          notification.close()
        }
      })
    })
  }

  // Display standard Notification (Reading from data fallback first)
  const notificationTitle = payload.data?.title || payload.notification?.title || 'New Notification'
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body,
    icon: '/favicon.ico', // Update this to your PWA icon
    data: payload.data, // Contains routing info like url, conversationId
  }

  // If it's a high priority call, add actionable buttons
  if (payload.data?.type === 'INCOMING_CALL') {
    notificationOptions.requireInteraction = true // Notification stays until user interacts
    notificationOptions.actions = [
      { action: 'answer', title: 'Answer' },
      { action: 'decline', title: 'Decline' }
    ]
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data

  // Handle Call Actions
  if (data?.type === 'INCOMING_CALL') {
    if (action === 'decline') {
      // In a real app, you might want to call an API here to decline the call on the server
      return
    }
    // If 'answer' or clicked on body, open the call room
    if (action === 'answer' || !action) {
      const urlToOpen = new URL(`/en/manage/chat?callRoom=${data.conversationId}`, self.location.origin).href
      event.waitUntil(openOrFocusUrl(urlToOpen))
      return
    }
  }

  // Handle Chat Actions
  if (data?.type === 'NEW_MESSAGE') {
    const urlToOpen = new URL(`/en/manage/chat?conversationId=${data.conversationId}`, self.location.origin).href
    event.waitUntil(openOrFocusUrl(urlToOpen))
  }
})

// Helper specific to Service Workers to find existing tabs or open new ones
async function openOrFocusUrl(url) {
  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
  
  // Custom logic to see if a matching url is already open
  for (let i = 0; i < windowClients.length; i++) {
    const client = windowClients[i]
    if (client.url === url && 'focus' in client) {
      return client.focus()
    }
  }
  
  // If not open, open a new window
  if (clients.openWindow) {
    return clients.openWindow(url)
  }
}
