'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import {
  useMuteConversationMutation,
  usePinConversationMutation,
  useUnmuteConversationMutation,
  useUnpinConversationMutation,
} from '@/queries/useChat'
import { ConversationType } from '@/schemaValidations/chat.schema'
import { Bell, BellOff, MoreVertical, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { MessageSearchDialog } from './message-search-dialog'

interface ChatHeaderProps {
  conversation: ConversationType | null
  currentUserId?: number | null
  onSelectMessage?: (messageId: { id: number; conversationId: number }) => void
}

export function ChatHeader({ conversation, currentUserId, onSelectMessage }: ChatHeaderProps) {
  const pinMutation = usePinConversationMutation()
  const unpinMutation = useUnpinConversationMutation()
  const muteMutation = useMuteConversationMutation()
  const unmuteMutation = useUnmuteConversationMutation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    )
  }

  const isPinned = conversation.pinnedBy && conversation.pinnedBy.length > 0
  const isMuted = conversation.participants.find((p) => p.isMuted)?.isMuted || false

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
    conversation.type === 'group' ? conversation.avatar : otherParticipants[0]?.account.avatar

  const handleTogglePin = async () => {
    if (!conversation) return
    try {
      if (isPinned) {
        await unpinMutation.mutateAsync(conversation.id)
        toast({ description: 'Conversation unpinned' })
      } else {
        await pinMutation.mutateAsync(conversation.id)
        toast({ description: 'Conversation pinned' })
      }
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handleToggleMute = async () => {
    if (!conversation) return
    try {
      if (isMuted) {
        await unmuteMutation.mutateAsync(conversation.id)
        toast({ description: 'Conversation unmuted' })
      } else {
        await muteMutation.mutateAsync(conversation.id)
        toast({ description: 'Conversation muted' })
      }
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <div className="flex h-full items-center justify-between">
      {/* Left side - Avatar and info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 cursor-pointer">
          <AvatarImage src={conversationAvatar || undefined} alt={conversationName} />
          <AvatarFallback>
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

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{conversationName}</h2>
            {isMuted && <BellOff className="h-4 w-4 text-muted-foreground" />}
            {conversation.type === 'group' && (
              <Badge variant="secondary" className="cursor-pointer text-xs">
                Group
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {conversation.type === 'group'
              ? `${conversation.participants.length} members`
              : 'Active now'}
          </p>
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search in conversation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleMute} className="cursor-pointer">
              {isMuted ? (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Unmute conversation
                </>
              ) : (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Mute conversation
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsSearchOpen(true)}>
              <Search className="mr-2 h-4 w-4" />
              Search messages
            </DropdownMenuItem>
            {conversation.type === 'group' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Manage members
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleTogglePin} className="cursor-pointer">
              {isPinned ? 'Unpin conversation' : 'Pin conversation'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Message Search Dialog */}
      <MessageSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        conversationId={conversation?.id}
        onSelectMessage={(message) => {
          onSelectMessage?.({ id: message.id, conversationId: message.conversationId })
        }}
      />
    </div>
  )
}
