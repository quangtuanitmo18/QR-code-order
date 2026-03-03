'use client'

import { cn } from '@/lib/utils'
import { Phone, PhoneMissed, PhoneOff, Video } from 'lucide-react'

interface CallMeta {
  callType: 'voice' | 'video'
  callStatus: 'completed' | 'missed' | 'declined'
  durationSeconds: number
}

interface CallMessageBubbleProps {
  callMeta: string // JSON string
  isOwnMessage: boolean
  timestamp: string
  senderName?: string
}

function formatCallDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m`
}

export function CallMessageBubble({
  callMeta: callMetaStr,
  isOwnMessage,
  timestamp,
}: CallMessageBubbleProps) {
  let meta: CallMeta
  try {
    meta = JSON.parse(callMetaStr)
  } catch {
    return null
  }

  const isCompleted = meta.callStatus === 'completed'
  const isMissed = meta.callStatus === 'missed'
  const isDeclined = meta.callStatus === 'declined'
  const isVideoCall = meta.callType === 'video'

  const Icon = isCompleted ? (isVideoCall ? Video : Phone) : isMissed ? PhoneMissed : PhoneOff

  const statusText = isCompleted
    ? `${isVideoCall ? 'Video' : 'Voice'} call`
    : isMissed
      ? `Missed ${isVideoCall ? 'video' : 'voice'} call`
      : `Declined ${isVideoCall ? 'video' : 'voice'} call`

  const durationText =
    isCompleted && meta.durationSeconds > 0 ? formatCallDuration(meta.durationSeconds) : null

  const time = new Date(timestamp)
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={cn('flex w-full justify-center py-2')}>
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm',
          isCompleted
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30'
            : 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30'
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            isCompleted
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex flex-col">
          <span
            className={cn(
              'text-sm font-semibold',
              isCompleted
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-red-700 dark:text-red-300'
            )}
          >
            {statusText}
          </span>
          <span className="text-xs text-muted-foreground">
            {durationText ? `${durationText} · ${timeStr}` : timeStr}
          </span>
        </div>
      </div>
    </div>
  )
}
