import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'
import ChatClient from './chat-client'

export default function ChatPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2 sm:space-y-4">
        <Card x-chunk="dashboard-06-chunk-0" className="h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Chat</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Communicate with your team members
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-120px)] p-0">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">Loading chat...</div>
              }
            >
              <ChatClient />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
