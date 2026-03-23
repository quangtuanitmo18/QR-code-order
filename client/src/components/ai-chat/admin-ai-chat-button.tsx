'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Role } from '@/constants/type'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  BarChart3,
  CheckCircle2,
  DollarSign,
  Loader2,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  StopCircle,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const QUICK_PROMPT_KEYS = ['quickPrompt1', 'quickPrompt2', 'quickPrompt3', 'quickPrompt4'] as const

export default function AdminAiChatButton() {
  const t = useTranslations('AdminAiChat')
  const { isAuth, role } = useAppStore()
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
        api: '/api/admin/ai-chat',
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

  // HITL: Track execution results for tools without execute (admin_cancel_order, admin_update_dish)
  const [hitlResults, setHitlResults] = useState<
    Record<string, { status: 'loading' | 'success' | 'error'; result?: any; error?: string }>
  >({})

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

  const resetChat = () => {
    setSessionId(undefined)
    setInput('')
    setHitlResults({})
    window.location.reload()
  }

  // Helper to map tool names to friendly UI text
  const getToolDisplayName = (toolName: string) => {
    switch (toolName) {
      case 'admin_get_revenue_trends':
        return t('toolRevenue')
      case 'admin_get_dish_performance':
        return t('toolDishPerformance')
      case 'admin_update_dish':
        return t('toolUpdateDish')
      case 'admin_cancel_order':
        return t('toolCancelOrder')
      case 'admin_get_live_orders':
        return t('toolLiveOrders')
      case 'admin_search_orders':
        return t('toolSearchOrders')
      default:
        return t('toolDefault')
    }
  }

  // Render rich tool result cards (Generative UI)
  const renderToolResult = (toolName: string, output: any, key: string) => {
    if (!output || typeof output === 'string') return null

    switch (toolName) {
      case 'admin_get_revenue_trends': {
        const { totalRevenue, paymentCount } = output
        return (
          <div
            key={key}
            className="my-2 rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50 p-3 text-xs dark:from-emerald-950/30 dark:to-teal-950/30"
          >
            <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
              {t('revenueSummary')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-white/70 p-2 text-center dark:bg-white/5">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalRevenue || 0)}
                </div>
                <div className="text-[10px] text-muted-foreground">{t('totalRevenue')}</div>
              </div>
              <div className="rounded-md bg-white/70 p-2 text-center dark:bg-white/5">
                <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
                  {paymentCount || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">{t('paidOrders')}</div>
              </div>
            </div>
          </div>
        )
      }

      case 'admin_get_dish_performance': {
        if (!Array.isArray(output)) return null
        return (
          <div
            key={key}
            className="my-2 rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 p-3 text-xs dark:from-amber-950/30 dark:to-orange-950/30"
          >
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
              <TrendingUp className="h-4 w-4" />
              {t('dishPerformance')}
            </div>
            <div className="space-y-1.5">
              {output.slice(0, 5).map((dish: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md bg-white/70 px-2.5 py-1.5 dark:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                      {idx + 1}
                    </span>
                    <span className="max-w-[120px] truncate font-medium text-foreground">
                      {dish.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{dish.totalOrdered}x</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(dish.price || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'admin_get_live_orders': {
        const { pendingOrderCount, activeTables } = output
        return (
          <div
            key={key}
            className="my-2 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-3 text-xs dark:from-blue-950/30 dark:to-indigo-950/30"
          >
            <div className="mb-2 flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400">
              <BarChart3 className="h-4 w-4" />
              {t('liveStatus')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-white/70 p-2 text-center dark:bg-white/5">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {pendingOrderCount || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">{t('pendingOrders')}</div>
              </div>
              <div className="rounded-md bg-white/70 p-2 text-center dark:bg-white/5">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {activeTables || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">{t('occupiedTables')}</div>
              </div>
            </div>
          </div>
        )
      }

      case 'admin_search_orders': {
        if (!Array.isArray(output)) return null
        return (
          <div
            key={key}
            className="my-2 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 p-3 text-xs dark:from-purple-950/30 dark:to-pink-950/30"
          >
            <div className="mb-2 flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-400">
              <Search className="h-4 w-4" />
              {t('searchResults')}
            </div>
            <div className="space-y-2">
              {output.length === 0 ? (
                <div className="px-2 italic text-muted-foreground">{t('noData')}</div>
              ) : (
                output.map((order: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 rounded-md bg-white/70 p-2 dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between font-medium text-foreground">
                      <span>
                        Order #{order.id} {order.tableNumber ? `(Table ${order.tableNumber})` : ''}
                      </span>
                      <span>{formatCurrency(order.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>
                        {order.guestName || 'Guest'} • {order.status}
                      </span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-1 space-y-0.5 border-t border-purple-100/50 pt-1 text-[10px] dark:border-purple-900/50">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-muted-foreground">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      }

      case 'admin_update_dish':
      case 'admin_cancel_order': {
        const isSuccess = output?.message && !output.message.toLowerCase().startsWith('failed')
        const isCancelled = output?.message?.includes('cancelled by the user')

        if (isCancelled) {
          return (
            <div
              key={key}
              className="my-2 flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>{t('confirmDeny')}</span>
            </div>
          )
        }

        return (
          <div
            key={key}
            className={`my-2 flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${
              isSuccess
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'border-destructive/20 bg-destructive/10 text-destructive'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            <span>{output?.message || t('operationCompleted')}</span>
          </div>
        )
      }

      default:
        return null
    }
  }

  // Only show for authenticated Owners
  if (!isAuth || role !== Role.Owner) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-primary/80 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-transform hover:scale-105 sm:bottom-8 sm:right-8"
          size="icon"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background sm:inset-auto sm:bottom-8 sm:right-8 sm:h-[600px] sm:w-[380px] sm:rounded-2xl sm:border sm:shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/90 p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold tracking-wide">{t('title')}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary/50 hover:text-white"
                onClick={resetChat}
                title="New Chat"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary/50 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900/20"
          >
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="mt-6 text-center">
                  <div className="mb-6 flex flex-col items-center justify-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="px-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{t('welcomeTitle')}</p>
                      <p>{t('welcomeDescription')}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {QUICK_PROMPT_KEYS.map((key, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubmit(undefined, t(key as any))}
                        disabled={isLoading}
                        className="rounded-lg border bg-card px-4 py-2 text-left text-sm text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                      >
                        {t(key as any)}
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
                    className={`flex max-w-[90%] flex-col gap-1 rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'prose prose-sm rounded-tl-sm border bg-card pr-6 leading-relaxed dark:prose-invert'
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
                                    <div className="my-2 overflow-x-auto rounded-md border">
                                      <table
                                        className="w-full border-collapse bg-background text-sm"
                                        {...props}
                                      />
                                    </div>
                                  ),
                                  th: ({ node, ...props }) => (
                                    <th
                                      className="border-b bg-muted/50 px-3 py-2 text-left font-medium text-muted-foreground"
                                      {...props}
                                    />
                                  ),
                                  td: ({ node, ...props }) => (
                                    <td
                                      className="border-b px-3 py-2 text-muted-foreground last:border-0"
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
                              toolName === 'admin_update_dish' || toolName === 'admin_cancel_order'
                            const isInputReady = (part as any).state === 'input-available'

                            if (isMutationTool && (isInputReady || hitlState)) {
                              // Already executed via REST — show result
                              if (hitlState?.status === 'success') {
                                return (
                                  <div
                                    key={toolCallId}
                                    className="my-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-sm shadow-sm"
                                  >
                                    <h4 className="mb-1 flex items-center gap-2 font-semibold text-green-600">
                                      <CheckCircle2 className="h-4 w-4" />
                                      {t('actionSuccess')}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {hitlState.result?.message ?? t('actionSuccess')}
                                    </p>
                                  </div>
                                )
                              }
                              if (hitlState?.status === 'error') {
                                return (
                                  <div
                                    key={toolCallId}
                                    className="my-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm shadow-sm"
                                  >
                                    <h4 className="mb-1 flex items-center gap-2 font-semibold text-destructive">
                                      <XCircle className="h-4 w-4" />
                                      {t('actionFailed')}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {hitlState.error}
                                    </p>
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
                              return (
                                <div
                                  key={toolCallId}
                                  className="my-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm shadow-sm"
                                >
                                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-destructive">
                                    <XCircle className="h-4 w-4" />
                                    {t('confirmTitle')}
                                  </h4>
                                  <p className="mb-4 text-muted-foreground">
                                    {toolName === 'admin_update_dish' &&
                                      t('confirmUpdateDish', { dishId: input?.dishId })}
                                    {toolName === 'admin_cancel_order' &&
                                      t('confirmCancelOrder', { orderId: input?.orderId })}
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="w-full"
                                      onClick={async () => {
                                        setHitlResults((prev) => ({
                                          ...prev,
                                          [toolCallId]: { status: 'loading' },
                                        }))
                                        try {
                                          const params =
                                            toolName === 'admin_cancel_order'
                                              ? { orderId: input.orderId, reason: input.reason }
                                              : { dishId: input.dishId, updates: input.updates }
                                          const res = await fetch(
                                            '/api/admin/ai-chat/execute-action',
                                            {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ action: toolName, params }),
                                            }
                                          )
                                          const data = await res.json()
                                          if (res.ok && data.success) {
                                            setHitlResults((prev) => ({
                                              ...prev,
                                              [toolCallId]: {
                                                status: 'success',
                                                result: data.result,
                                              },
                                            }))
                                          } else {
                                            setHitlResults((prev) => ({
                                              ...prev,
                                              [toolCallId]: {
                                                status: 'error',
                                                error: data.error || 'Unknown error',
                                              },
                                            }))
                                          }
                                        } catch (err: any) {
                                          setHitlResults((prev) => ({
                                            ...prev,
                                            [toolCallId]: { status: 'error', error: err.message },
                                          }))
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      {t('confirmApprove')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        setHitlResults((prev) => ({
                                          ...prev,
                                          [toolCallId]: {
                                            status: 'success',
                                            result: { message: t('actionDenied') },
                                          },
                                        }))
                                      }}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      {t('confirmDeny')}
                                    </Button>
                                  </div>
                                </div>
                              )
                            }

                            // Show rich card when tool output is available
                            if ((part as any).state === 'output-available') {
                              const output = (part as any).output
                              return renderToolResult(toolName, output, `${m.id}-${i}`)
                            }
                            if (
                              (part as any).state === 'output-error' ||
                              (part as any).state === 'output-denied'
                            ) {
                              return (
                                <div
                                  key={`${m.id}-${i}`}
                                  className="my-2 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>{t('toolFailed', { toolName })}</span>
                                </div>
                              )
                            }

                            // Default: show loading spinner for in-progress tools
                            return (
                              <div
                                key={`${m.id}-${i}`}
                                className="my-2 flex items-center gap-2 rounded-md bg-accent/50 px-3 py-2 text-xs font-medium text-accent-foreground"
                              >
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
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

              {/* Loading indicator — show whenever AI is streaming */}
              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-card px-4 py-3 text-sm shadow-sm">
                    <span className="flex items-center gap-2 font-medium text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      {t('loading')}
                    </span>
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error.message || t('errorDefault')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex flex-col gap-2 border-t bg-background p-4">
            {/* Abort Streaming Button */}
            {status === 'streaming' && (
              <div className="mb-1 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stop()}
                  className="flex h-7 items-center gap-1 rounded-full bg-muted/50 px-3 text-xs hover:bg-muted"
                  type="button"
                >
                  <StopCircle className="h-3 w-3 text-muted-foreground" />
                  {t('stopButton')}
                </Button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('inputPlaceholder')}
                className="flex-1 bg-muted/20 shadow-inner"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
