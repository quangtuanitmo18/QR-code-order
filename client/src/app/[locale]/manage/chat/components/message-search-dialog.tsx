'use client'

import { useState, useEffect } from 'react'
import { Search, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// ScrollArea not available, using div with overflow
import { useSearchMessagesQuery } from '@/queries/useMessage'
import { format, isToday, isYesterday } from 'date-fns'
import { cn } from '@/lib/utils'
import { MessageType } from '@/schemaValidations/message.schema'

interface MessageSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: number
  onSelectMessage?: (message: MessageType) => void
}

export function MessageSearchDialog({
  open,
  onOpenChange,
  conversationId,
  onSelectMessage,
}: MessageSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const searchMessagesQuery = useSearchMessagesQuery(
    {
      q: debouncedQuery,
      conversationId: conversationId,
      page: 1,
      limit: 50,
    },
    debouncedQuery.length >= 2
  )

  const searchResults = searchMessagesQuery.data?.payload.data.messages || []

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM d, HH:mm')
    }
  }

  const handleSelectMessage = (message: MessageType) => {
    onSelectMessage?.(message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
          <DialogDescription>Search for messages across your conversations</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search messages... (minimum 2 characters)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Search Results */}
          <div className="h-[400px] overflow-y-auto rounded-md border">
            {!debouncedQuery || debouncedQuery.length < 2 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Enter at least 2 characters to search</p>
                </div>
              </div>
            ) : searchMessagesQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No messages found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {searchResults.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent',
                      message.isDeleted && 'opacity-50'
                    )}
                    onClick={() => !message.isDeleted && handleSelectMessage(message)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.sender?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {message.isDeleted ? 'Message deleted' : message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
