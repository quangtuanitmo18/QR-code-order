'use client'

import { useState } from 'react'

export default function SentryDirectTestPage() {
  const [result, setResult] = useState<string>('')

  const testDirect = async () => {
    try {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
      if (!dsn) {
        setResult('DSN not found in environment variables')
        return
      }

      // Parse the DSN to get the API endpoint
      const dsnUrl = new URL(dsn)
      const projectId = dsnUrl.pathname.substring(1)
      const protocol = dsnUrl.protocol
      const host = dsnUrl.host

      // Construct the API endpoint
      const endpoint = `${protocol}//${host}/api/${projectId}/store/`

      // Create a basic Sentry event
      const event = {
        event_id: crypto.randomUUID().replace(/-/g, ''),
        message: 'Direct test from frontend',
        timestamp: new Date().toISOString(),
        platform: 'javascript',
        level: 'info',
      }

      // Send directly to the API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=manual-test/1.0, sentry_key=${dsnUrl.username}`,
        },
        body: JSON.stringify(event),
      })

      const data = await response.text()
      setResult(`Response: ${response.status} - ${data}`)
    } catch (error) {
      setResult(`Error: ${error}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Direct Sentry Test</h1>
      <button onClick={testDirect} className="rounded bg-purple-500 p-2 text-white">
        Send Direct Test
      </button>
      {result && <pre className="mt-4 rounded bg-gray-100 p-4">{result}</pre>}
    </div>
  )
}
