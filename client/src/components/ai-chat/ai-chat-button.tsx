'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessagesSquare, Send, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AiChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    scrollToBottom()

    try {
      const response = await fetch('/api/guest/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.text()

      // Parse AI SDK Data Stream Protocol or plain text
      let assistantText = ''
      const lines = data.split('\n')
      for (const line of lines) {
        if (line.startsWith('0:')) {
          // Text delta in Data Stream Protocol
          try {
            assistantText += JSON.parse(line.slice(2))
          } catch {
            assistantText += line.slice(2)
          }
        }
      }

      // Fallback: if no protocol lines found, use raw text
      if (!assistantText) {
        assistantText = data
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantText
      }

      setMessages((prev) => [...prev, assistantMessage])
      scrollToBottom()
    } catch (error) {
      console.error('[AI Chat] Error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className='fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg sm:bottom-8 sm:right-8'
          size='icon'
        >
          <MessagesSquare className='h-6 w-6' />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className='fixed bottom-4 right-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:bottom-8 sm:right-8 z-50'>
          {/* Header */}
          <div className='flex items-center justify-between bg-primary p-4 text-primary-foreground'>
            <div className='flex items-center gap-2'>
              <MessagesSquare className='h-5 w-5' />
              <h3 className='font-semibold'>AI Assistant</h3>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='text-primary-foreground hover:bg-primary/90'
              onClick={() => setIsOpen(false)}
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4'>
            <div className='space-y-4'>
              {messages.length === 0 && (
                <div className='text-center text-sm text-muted-foreground mt-10'>
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
                        : 'bg-muted prose prose-sm dark:prose-invert'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className='flex justify-start'>
                  <div className='max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm'>
                    <span className='animate-pulse'>Đang suy nghĩ...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className='border-t p-4'>
            <form onSubmit={handleSubmit} className='flex items-center gap-2'>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Nhập câu hỏi của bạn...'
                className='flex-1'
                disabled={isLoading}
              />
              <Button type='submit' size='icon' disabled={isLoading || !input.trim()}>
                <Send className='h-4 w-4' />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
