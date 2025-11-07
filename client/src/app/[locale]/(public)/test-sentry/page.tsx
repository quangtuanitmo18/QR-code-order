'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect, useState } from 'react'

export default function TestSentryPage() {
  const [result, setResult] = useState<string>('')
  const [sentryStatus, setSentryStatus] = useState<string>('Checking Sentry...')

  useEffect(() => {
    // Check if Sentry is properly initialized
    if (Sentry) {
      console.log('Sentry object:', Sentry)
      setSentryStatus('Sentry is available')
    } else {
      setSentryStatus('Sentry is NOT available')
    }
  }, [])

  const triggerHandledError = () => {
    console.log('Triggering handled error...')
    try {
      throw new Error('Test handled error from frontend')
    } catch (error) {
      console.log('Caught error, sending to Sentry:', error)
      try {
        Sentry.captureException(error)
        console.log('Error sent to Sentry')
        setResult('Handled error sent to GlitchTip!')
      } catch (sentryError) {
        console.error('Failed to send to Sentry:', sentryError)
        setResult('Failed to send error: ' + sentryError)
      }
    }
  }

  const triggerMessage = () => {
    console.log('Sending message to Sentry...')
    try {
      Sentry.captureMessage('Test message from frontend', 'info')
      console.log('Message sent to Sentry')
      setResult('Message sent to GlitchTip!')
    } catch (error) {
      console.error('Failed to send message:', error)
      setResult('Failed to send message: ' + error)
    }
  }

  const triggerUnhandledError = () => {
    console.log('About to trigger unhandled error...')
    // This will crash the component but should be caught by Sentry
    const obj: any = null
    obj.nonExistentMethod()
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Test Sentry Integration</h1>
      <div className="mb-4 rounded bg-gray-100 p-2">
        <p>
          Sentry Status: <span className="font-mono">{sentryStatus}</span>
        </p>
        <p>
          DSN:{' '}
          <span className="font-mono">{process.env.NEXT_PUBLIC_SENTRY_DSN || 'Not found'}</span>
        </p>
        <p>
          Environment: <span className="font-mono">{process.env.NODE_ENV || 'Not set'}</span>
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <button onClick={triggerHandledError} className="rounded bg-blue-500 p-2 text-white">
          Trigger Handled Error
        </button>
        <button onClick={triggerMessage} className="rounded bg-green-500 p-2 text-white">
          Send Test Message
        </button>
        <button onClick={triggerUnhandledError} className="rounded bg-red-500 p-2 text-white">
          Trigger Unhandled Error
        </button>
      </div>
      {result && <p className="mt-4 font-medium">{result}</p>}
    </div>
  )
}
