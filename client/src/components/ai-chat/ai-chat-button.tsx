'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@ai-sdk/react'
import { Loader2, MessagesSquare, Send, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AiChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)

  // AI SDK v6 useChat hook — manages messages, streaming, tool states
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/guest/ai-chat',
    body: { sessionId },
    onResponse: (res) => {
      const id = res.headers.get('x-ai-session-id')
      if (id && !sessionId) {
        setSessionId(id)
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 50)
  }, [])

  // Auto-scroll on new messages or streaming content
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    sendMessage({ text })
    setInput('')
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg sm:bottom-8 sm:right-8"
          size="icon"
        >
          <MessagesSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:bottom-8 sm:right-8">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessagesSquare className="h-5 w-5" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="mt-10 text-center text-sm text-muted-foreground">
                  <p>Xin chào! Em là trợ lý AI của nhà hàng.</p>
                  <p>Anh/chị cần tư vấn món ăn hay thông tin gì ạ?</p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'prose prose-sm bg-muted dark:prose-invert'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div>
                        {m.parts.map((part, i) => {
                          if (part.type === 'text') {
                            return (
                              <ReactMarkdown key={`${m.id}-${i}`} remarkPlugins={[remarkGfm]}>
                                {part.text}
                              </ReactMarkdown>
                            )
                          }
                          // Show tool states for transparency
                          if (part.type === 'tool-invocation') {
                            if (part.state === 'result') {
                              return null // Tool completed, text response will show the result
                            }
                            return (
                              <div
                                key={`${m.id}-${i}`}
                                className="my-1 flex items-center gap-1 text-xs text-muted-foreground"
                              >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Đang tra cứu thực đơn...</span>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    ) : (
                      // Render user message text from parts
                      m.parts
                        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                        .map((p) => p.text)
                        .join('')
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                )}

              {/* Error display */}
              {error && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
