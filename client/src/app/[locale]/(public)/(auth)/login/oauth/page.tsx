import Oauth from '@/app/[locale]/(public)/(auth)/login/oauth/oauth'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Google Login Redirect',
  description: 'Google Login Redirect',
  robots: {
    index: false
  }
}

export default function OAuthPage() {
  return <Oauth />
}
