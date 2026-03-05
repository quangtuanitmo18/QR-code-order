import envConfig from '@/config'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    console.log('[AI Chat Proxy] Request body:', JSON.stringify(body).substring(0, 200))

    const response = await fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    })

    console.log('[AI Chat Proxy] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('[AI Chat Proxy] Backend error:', errorText.substring(0, 200))
      return new Response(errorText, { status: response.status })
    }

    // Read the full text response first to debug
    const responseText = await response.text()
    console.log('[AI Chat Proxy] Backend response body:', responseText.substring(0, 300))

    // Return as AI SDK Data Stream Protocol
    return new Response(responseText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    })
  } catch (error) {
    console.error('[AI Chat Proxy] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
