'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Loader2, MessagesSquare, Send, StopCircle, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const QUICK_PROMPT_KEYS = ['quickPrompt1', 'quickPrompt2', 'quickPrompt3', 'quickPrompt4'] as const

export default function AiChatButton() {
  const t = useTranslations('AiChat')
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  // Create transport with custom fetch to intercept response headers for session ID
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/guest/ai-chat',
        body: () => ({ sessionId: sessionIdRef.current }),
        fetch: async (input, init) => {
          const res = await globalThis.fetch(input, init)
          const id = res.headers.get('x-ai-session-id')
          if (id && !sessionIdRef.current) {
            setSessionId(id)
          }
          return res
        },
      }),
    []
  )

  // AI SDK v6 useChat hook — manages messages, streaming, tool states
  const { messages, sendMessage, status, error, stop } = useChat({ transport })

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

  const handleSubmit = (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault()
    const text = customText || input.trim()
    if (!text || isLoading) return

    sendMessage({ text })
    if (!customText) setInput('')
  }

  // Helper to map tool names to friendly UI text
  const getToolDisplayName = (toolName: string) => {
    switch (toolName) {
      case 'searchMenu':
        return t('toolSearchMenu')
      case 'searchMenuSemantic':
        return t('toolSearchSemantic')
      case 'getDishDetails':
        return t('toolDishDetails')
      default:
        return t('toolDefault')
    }
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
        <div className="fixed bottom-4 right-4 z-50 flex h-[550px] w-[350px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:bottom-8 sm:right-8">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessagesSquare className="h-5 w-5" />
              <h3 className="font-semibold">{t('title')}</h3>
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
                <div className="mt-8 text-center">
                  <div className="mb-6 text-sm text-muted-foreground">
                    <p>{t('welcomeLine1')}</p>
                    <p>{t('welcomeLine2')}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {QUICK_PROMPT_KEYS.map((key, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubmit(undefined, t(key))}
                        className="rounded-lg border bg-card px-4 py-2 text-sm text-card-foreground transition-colors hover:bg-accent"
                        type="button"
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[90%] flex-col gap-1 rounded-2xl px-4 py-3 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'prose prose-sm bg-muted pr-6 leading-relaxed dark:prose-invert' // Added leading-relaxed and pr-6 for markdown readability
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div>
                        {m.parts.map((part, i) => {
                          if (part.type === 'text') {
                            return (
                              <ReactMarkdown
                                key={`${m.id}-${i}`}
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({ node, ...props }) => (
                                    <div className="my-2 overflow-x-auto">
                                      <table
                                        className="w-full border-collapse border border-muted-foreground/20"
                                        {...props}
                                      />
                                    </div>
                                  ),
                                  th: ({ node, ...props }) => (
                                    <th
                                      className="border border-muted-foreground/20 bg-muted-foreground/10 px-2 py-1 text-left"
                                      {...props}
                                    />
                                  ),
                                  td: ({ node, ...props }) => (
                                    <td
                                      className="border border-muted-foreground/20 px-2 py-1"
                                      {...props}
                                    />
                                  ),
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            )
                          }
                          // Show tool states for transparency
                          if (part.type === 'tool-invocation') {
                            if (
                              part.state === 'output-available' ||
                              part.state === 'output-error' ||
                              part.state === 'output-denied'
                            ) {
                              return null // Tool completed, text response will show the result
                            }
                            return (
                              <div
                                key={`${m.id}-${i}`}
                                className="my-2 flex items-center gap-2 rounded-md bg-background/50 p-2 text-xs text-muted-foreground"
                              >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>
                                  {getToolDisplayName(
                                    'toolName' in part ? (part as any).toolName : 'unknown'
                                  )}
                                </span>
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
                        {t('loading')}
                      </span>
                    </div>
                  </div>
                )}

              {/* Error display */}
              {error && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error.message || t('errorDefault')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex flex-col gap-2 border-t p-4">
            {/* Abort Streaming Button */}
            {status === 'streaming' && (
              <div className="mb-1 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stop()}
                  className="flex h-7 items-center gap-1 rounded-full px-3 text-xs"
                  type="button"
                >
                  <StopCircle className="h-3 w-3" />
                  {t('stopButton')}
                </Button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('inputPlaceholder')}
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
