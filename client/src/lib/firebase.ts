import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported, Messaging } from '@firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBnEKN2v2qz2RJWp2wtZkJoJ-FhAj90eeo",
  authDomain: "qr-coder-code.firebaseapp.com",
  projectId: "qr-coder-code",
  storageBucket: "qr-coder-code.firebasestorage.app",
  messagingSenderId: "201344117976",
  appId: "1:201344117976:web:893aebeb332b1ede78bbad",
  measurementId: "G-JL9MYW5BQF"
};

export const app = initializeApp(firebaseConfig)

// messaging is initialized only when supported (e.g., supported browsers, HTTPS)
export const messaging = async (): Promise<Messaging | null> => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(app)
  }
  return null
}
