import { Suspense } from 'react'
import ChatClient from './chat-client'

export default function ChatPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="h-[calc(100vh-200px)]">
        <div className="h-[calc(100%-120px)] p-0">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">Loading chat...</div>
            }
          >
            <ChatClient />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
