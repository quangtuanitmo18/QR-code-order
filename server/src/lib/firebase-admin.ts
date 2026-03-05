import envConfig from '@/config'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin lazily to prevent multiple initialization errors
export const getFirebaseAdmin = () => {
  if (!admin.apps.length) {
    try {
      // Use credentials from the type-checked envConfig
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: envConfig.FIREBASE_PROJECT_ID,
          clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines with actual newline characters
          privateKey: envConfig.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      })
      console.log('Firebase Admin initialized successfully.')
    } catch (error) {
      console.error('Firebase Admin initialization error', error)
    }
  }
  return admin
}

export const messaging = getFirebaseAdmin().messaging()
