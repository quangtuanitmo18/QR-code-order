import envConfig from '@/config'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    const response = await fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/ai-chat/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(errorText, { status: response.status })
    }

    // Stream the response body directly through (don't buffer with .text())
    // This preserves the AI SDK UIMessageStream format from the backend
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      if (
        key === 'content-type' ||
        key === 'x-vercel-ai-data-stream' ||
        key === 'x-vercel-ai-ui-message-stream' ||
        key === 'x-ai-session-id'
      ) {
        headers[key] = value
      }
    })

    return new Response(response.body, {
      status: response.status,
      headers,
    })
  } catch (error) {
    console.error('[Admin AI Chat Proxy] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
