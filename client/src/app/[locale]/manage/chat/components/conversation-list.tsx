'use client'

import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns'
import { Search, Pin, VolumeX, MoreVertical, Users, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// ScrollArea component not available, using div with overflow instead
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConversationType } from '@/schemaValidations/chat.schema'
import { useState } from 'react'

interface ConversationListProps {
  conversations: ConversationType[]
  selectedConversationId: number | null
  onSelectConversation: (conversationId: number) => void
  onCreateConversation?: () => void
  currentUserId?: number | null
}

// Enhanced time formatting function
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, 'h:mm a') // 3:30 PM
  } else if (isYesterday(date)) {
    return 'Yesterday'
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE') // Day name
  } else if (isThisYear(date)) {
    return format(date, 'MMM d') // Jan 15
  } else {
    return format(date, 'dd/MM/yy') // 15/01/24
  }
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  currentUserId,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter((conversation) => {
    const searchLower = searchQuery.toLowerCase()
    const name = conversation.name || ''
    const participantNames = conversation.participants
      .map((p) => p.account.name)
      .join(' ')
      .toLowerCase()

    return name.toLowerCase().includes(searchLower) || participantNames.includes(searchLower)
  })

  const sortedConversations = filteredConversations.sort((a, b) => {
    // Pinned conversations first
    const aPinned = a.pinnedBy && a.pinnedBy.length > 0
    const bPinned = b.pinnedBy && b.pinnedBy.length > 0
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1

    // Then by updatedAt timestamp
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // Get last message preview
  const getLastMessagePreview = (conversation: ConversationType) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[0]
      return lastMessage.content
    }
    return 'No messages yet'
  }

  // Get unread count
  const getUnreadCount = (conversation: ConversationType) => {
    return conversation.unreadCount || 0
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden h-16 flex-shrink-0 items-center justify-between border-b px-4 lg:flex">
        <h2 className="text-lg font-semibold">Messages</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 cursor-pointer p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer" onClick={onCreateConversation}>
              New Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Chat Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cursor-text pl-9"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {sortedConversations.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No conversations found
            </div>
          ) : (
            sortedConversations.map((conversation) => {
              const isPinned = conversation.pinnedBy && conversation.pinnedBy.length > 0
              const isMuted = conversation.participants.find((p) => p.isMuted)?.isMuted || false
              const isSelected = selectedConversationId === conversation.id

              // Get conversation name and avatar
              const otherParticipants =
                conversation.type === 'group'
                  ? conversation.participants
                  : conversation.participants.filter((p) => p.accountId !== currentUserId)

              const conversationName =
                conversation.type === 'group'
                  ? conversation.name || 'Group Chat'
                  : otherParticipants.map((p) => p.account.name).join(', ') || 'Unknown'

              const conversationAvatar =
                conversation.type === 'group'
                  ? conversation.avatar
                  : otherParticipants[0]?.account.avatar

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    'relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-lg p-3 transition-colors hover:bg-accent/50',
                    isSelected ? 'bg-accent text-accent-foreground' : ''
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className={cn('h-12 w-12', isSelected && 'ring-2 ring-background')}>
                      <AvatarImage src={conversationAvatar || undefined} alt={conversationName} />
                      <AvatarFallback className="text-sm">
                        {conversation.type === 'group' ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          conversationName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </AvatarFallback>
                    </Avatar>

                    {/* Group indicator */}
                    {conversation.type === 'group' && (
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-blue-500">
                        <Hash className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="mb-1 flex min-w-0 items-center justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden pr-2">
                        <h3 className="min-w-0 max-w-[160px] truncate font-medium lg:max-w-[180px]">
                          {conversationName}
                        </h3>
                        {isPinned && (
                          <Pin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        )}
                        {isMuted && (
                          <VolumeX className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <span className="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                        {formatMessageTime(conversation.updatedAt)}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="min-w-0 max-w-[180px] flex-1 truncate pr-2 text-sm text-muted-foreground lg:max-w-[200px]">
                        {getLastMessagePreview(conversation)}
                      </p>

                      {/* Unread count */}
                      {getUnreadCount(conversation) > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 min-w-[20px] flex-shrink-0 cursor-pointer text-xs"
                        >
                          {getUnreadCount(conversation) > 99 ? '99+' : getUnreadCount(conversation)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
