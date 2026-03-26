'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { CheckCircle2, Loader2, MessagesSquare, Send, ShoppingCart, AlertTriangle, StopCircle, X, XCircle } from 'lucide-react'
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
  const [hitlResults, setHitlResults] = useState<
    Record<
      string,
      { status: 'loading' | 'success' | 'error' | 'denied'; result?: any; error?: string }
    >
  >({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  // Create transport with custom fetch to intercept response headers for session ID
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/guest/ai-chat',
        body: () => ({ sessionId: sessionIdRef.current, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
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

  // Handle HITL action execution
  const handleAction = async (toolCallId: string, toolName: string, params: any) => {
    setHitlResults((prev) => ({
      ...prev,
      [toolCallId]: { status: 'loading' },
    }))

    try {
      const res = await fetch('/api/guest/ai-chat/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: toolName, params }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('actionFailed'))
      }

      setHitlResults((prev) => ({
        ...prev,
        [toolCallId]: {
          status: 'success',
          result: data.result ?? data, // unwrap {success, result} wrapper
        },
      }))
    } catch (error: any) {
      setHitlResults((prev) => ({
        ...prev,
        [toolCallId]: {
          status: 'error',
          error: error.message || t('actionFailed'),
        },
      }))
    }
  }

  const handleDeny = (toolCallId: string) => {
    setHitlResults((prev) => ({
      ...prev,
      [toolCallId]: { status: 'denied', error: t('actionDenied') },
    }))
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
      case 'getOrderStatus':
        return t('toolOrderStatus')
      case 'getAvailableCoupons':
        return t('toolAvailableCoupons')
      case 'getRestaurantInfo':
        return t('toolRestaurantInfo')
      case 'getMenuCategories':
        return t('toolMenuCategories')
      case 'getPopularDishes':
        return t('toolPopularDishes')
      case 'searchFAQ':
        return t('toolSearchFAQ')
      case 'placeOrder':
        return t('toolPlaceOrder')
      case 'cancelOrder':
        return t('toolCancelOrder')
      case 'applyCoupon':
        return t('toolApplyCoupon')
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
                        disabled={isLoading}
                        className="rounded-lg border bg-card px-4 py-2 text-sm text-card-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                          // AI SDK v6: tools without execute produce parts with type 'tool-invocation'
                          // and state 'input-available'. Tools with execute produce 'output-available'.
                          const isToolPart =
                            part.type === 'tool-invocation' || part.type.startsWith('tool-')
                          if (isToolPart) {
                            const toolName =
                              'toolName' in part
                                ? (part as any).toolName
                                : part.type.replace('tool-', '')
                            const toolCallId = (part as any).toolCallId || `${m.id}-${i}`
                            const hitlState = hitlResults[toolCallId]

                            // HITL: Show confirmation card for mutation tools without execute
                            const isMutationTool =
                              toolName === 'placeOrder' ||
                              toolName === 'cancelOrder' ||
                              toolName === 'applyCoupon'
                            const isInputReady = (part as any).state === 'input-available'

                            if (isMutationTool && (isInputReady || hitlState)) {
                              // Already executed via REST — show result
                              if (hitlState?.status === 'success') {
                                const res = hitlState.result
                                return (
                                  <div
                                    key={toolCallId}
                                    className="my-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-sm shadow-sm"
                                  >
                                    <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-600">
                                      <CheckCircle2 className="h-4 w-4" />
                                      {t('actionSuccess')}
                                    </h4>

                                    {/* placeOrder: show message + item breakdown */}
                                    {toolName === 'placeOrder' && res?.items ? (
                                      <div>
                                        <p className="mb-2 text-xs text-muted-foreground">{res.message}</p>
                                        <ul className="mb-2 space-y-1">
                                          {res.items.map((item: { name: string; quantity: number; unitPrice: number; subtotal: number }, idx: number) => (
                                            <li key={idx} className="flex items-center justify-between rounded-md bg-background/60 px-3 py-1.5 text-xs">
                                              <span className="font-medium">{item.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
                                              <span>${item.unitPrice}</span>
                                            </li>
                                          ))}
                                        </ul>
                                        {res.totalAmount != null && (
                                          <p className="text-right text-xs font-semibold text-green-700">
                                            Total: ${res.totalAmount}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        {res?.message ?? t('actionSuccess')}
                                      </p>
                                    )}
                                  </div>
                                )
                              }
                              if (hitlState?.status === 'error' || hitlState?.status === 'denied') {
                                const input = (part as any).input
                                return (
                                  <div
                                    key={toolCallId}
                                    className="my-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm shadow-sm"
                                  >
                                    <h4 className="mb-1 flex items-center gap-2 font-semibold text-destructive">
                                      <XCircle className="h-4 w-4" />
                                      {hitlState.status === 'denied'
                                        ? t('actionDenied')
                                        : t('actionFailed')}
                                    </h4>
                                    {hitlState.error && (
                                      <p className="mb-3 text-xs text-muted-foreground">{hitlState.error}</p>
                                    )}
                                    {/* Retry button — only for actual errors, not user-denied */}
                                    {hitlState.status === 'error' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs"
                                        onClick={() => handleAction(toolCallId, toolName, input)}
                                      >
                                        {t('retryAction')}
                                      </Button>
                                    )}
                                  </div>
                                )
                              }
                              if (hitlState?.status === 'loading') {
                                return (
                                  <div
                                    key={toolCallId}
                                    className="my-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm shadow-sm"
                                  >
                                    <div className="flex items-center gap-2 font-medium text-primary">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      {t('actionExecuting')}
                                    </div>
                                  </div>
                                )
                              }

                              // Pending confirmation — show card with Approve/Deny buttons
                              const input = (part as any).input
                              const isDestructiveAction = toolName === 'cancelOrder'
                              return (
                                <div
                                  key={toolCallId}
                                  className={`my-3 rounded-lg border p-4 text-sm shadow-sm ${
                                    isDestructiveAction
                                      ? 'border-destructive/30 bg-destructive/5'
                                      : 'border-green-500/30 bg-green-500/5'
                                  }`}
                                >
                                  <h4
                                    className={`mb-2 flex items-center gap-2 font-semibold ${
                                      isDestructiveAction ? 'text-destructive' : 'text-green-600'
                                    }`}
                                  >
                                    {isDestructiveAction ? (
                                      <AlertTriangle className="h-4 w-4" />
                                    ) : (
                                      <ShoppingCart className="h-4 w-4" />
                                    )}
                                    {t('confirmTitle')}
                                  </h4>

                                  {/* Confirmation body — show item details for placeOrder */}
                                  {toolName === 'placeOrder' && input?.items?.length > 0 ? (
                                    <div className="mb-4">
                                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        {t('confirmPlaceOrder', { count: input.items.length })}
                                      </p>
                                      <ul className="space-y-1">
                                        {input.items.map((item: { dishName: string; quantity: number }, idx: number) => (
                                          <li key={idx} className="flex items-center justify-between rounded-md bg-background/60 px-3 py-1.5 text-xs">
                                            <span className="font-medium">{item.dishName}</span>
                                            <span className="text-muted-foreground">× {item.quantity}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="mb-4 text-muted-foreground">
                                      {toolName === 'cancelOrder' &&
                                        t('confirmCancelOrder', { orderId: input?.orderId })}
                                      {toolName === 'applyCoupon' &&
                                        t('confirmApplyCoupon', {
                                          couponCode: input?.couponCode,
                                          orderId: input?.orderId,
                                        })}
                                    </p>
                                  )}

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant={isDestructiveAction ? 'destructive' : 'default'}
                                      className={`w-full ${
                                        !isDestructiveAction
                                          ? 'bg-green-600 text-white hover:bg-green-700'
                                          : ''
                                      }`}
                                      onClick={() => handleAction(toolCallId, toolName, input)}
                                    >
                                      {t('confirmApprove')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => handleDeny(toolCallId)}
                                    >
                                      {t('confirmDeny')}
                                    </Button>
                                  </div>
                                </div>
                              )
                            }

                            // Standard tools with execute() (like searchMenu, getDishDetails)
                            // We ignore them here since the text output already contains the data we want to show
                            // but we can show a loader while it's executing.
                            if (
                              (part as any).state === 'output-available' ||
                              (part as any).state === 'output-error'
                            ) {
                              return null // Tool completed, text response will show the result
                            }

                            return (
                              <div
                                key={`${m.id}-${i}`}
                                className="my-2 flex items-center gap-2 rounded-md bg-background/50 p-2 text-xs text-muted-foreground"
                              >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>{getToolDisplayName(toolName)}</span>
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

              {/* Loading indicator — show whenever AI is streaming, regardless of last message role */}
              {isLoading && messages.length > 0 && (
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
