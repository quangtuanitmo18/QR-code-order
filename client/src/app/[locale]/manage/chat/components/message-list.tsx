'use client'

import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { CheckCheck, MoreHorizontal, Reply, Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageType } from '@/schemaValidations/message.schema'
import { ConversationParticipantType } from '@/schemaValidations/chat.schema'
import {
  useEditMessageMutation,
  useDeleteMessageMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
} from '@/queries/useMessage'
import { handleErrorApi } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { EditMessageDialog } from './edit-message-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Smile } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface MessageListProps {
  messages: MessageType[]
  currentUserId: number | null
  typingUsers?: number[]
}

export function MessageList({ messages, currentUserId, typingUsers = [] }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const previousMessageCountRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  // Edit/Delete state
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingMessageContent, setEditingMessageContent] = useState<string>('')
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null)

  // Mutations
  const editMutation = useEditMessageMutation()
  const deleteMutation = useDeleteMessageMutation()
  const addReactionMutation = useAddReactionMutation()
  const removeReactionMutation = useRemoveReactionMutation()

  // Common emojis for reactions
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥']

  // Auto-scroll to bottom only when new messages are added (not on initial load)
  useEffect(() => {
    // Skip auto-scroll on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      previousMessageCountRef.current = messages.length
      // Scroll to bottom on initial load
      setTimeout(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'auto' })
        }
      }, 100)
      return
    }

    // Only auto-scroll if new messages were added
    if (messages.length > previousMessageCountRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    previousMessageCountRef.current = messages.length
  }, [messages])

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

  const shouldShowAvatar = (message: MessageType, index: number) => {
    if (message.senderId === currentUserId) return false
    if (index === 0) return true

    const prevMessage = messages[index - 1]
    return prevMessage.senderId !== message.senderId
  }

  const shouldShowName = (message: MessageType, index: number) => {
    if (message.senderId === currentUserId) return false
    if (index === 0) return true

    const prevMessage = messages[index - 1]
    return prevMessage.senderId !== message.senderId
  }

  const isConsecutiveMessage = (message: MessageType, index: number) => {
    if (index === 0) return false

    const prevMessage = messages[index - 1]
    const timeDiff =
      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()

    return prevMessage.senderId === message.senderId && timeDiff < 5 * 60 * 1000 // 5 minutes
  }

  const groupMessagesByDay = (messages: MessageType[]) => {
    const groups: { date: string; messages: MessageType[] }[] = []

    messages.forEach((message) => {
      const messageDate = format(new Date(message.createdAt), 'yyyy-MM-dd')
      const lastGroup = groups[groups.length - 1]

      if (lastGroup && lastGroup.date === messageDate) {
        lastGroup.messages.push(message)
      } else {
        groups.push({
          date: messageDate,
          messages: [message],
        })
      }
    })

    return groups
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return 'Today'
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'EEEE, MMMM d')
    }
  }

  const messageGroups = groupMessagesByDay(messages)

  return (
    <div className="flex-1 overflow-y-auto px-4" ref={scrollAreaRef}>
      <div className="space-y-4 py-4">
        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-2">
              <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Messages for this day */}
            <div className="space-y-1">
              {group.messages.map((message, messageIndex) => {
                const isOwnMessage = message.senderId === currentUserId
                const showAvatar = shouldShowAvatar(message, messageIndex)
                const showName = shouldShowName(message, messageIndex)
                const isConsecutive = isConsecutiveMessage(message, messageIndex)

                // Handle deleted messages
                if (message.isDeleted && !isOwnMessage) {
                  return (
                    <div
                      key={message.id}
                      className={cn('group flex gap-3', isOwnMessage && 'flex-row-reverse')}
                    >
                      <div className="max-w-[70%] flex-1">
                        <div className="px-3 py-2 text-sm italic text-muted-foreground">
                          Message deleted
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'group flex gap-3',
                      isOwnMessage && 'flex-row-reverse',
                      isConsecutive && !isOwnMessage && 'ml-12'
                    )}
                  >
                    {/* Avatar */}
                    {!isOwnMessage && (
                      <div className="w-8">
                        {showAvatar && message.sender && (
                          <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarImage
                              src={message.sender.avatar || undefined}
                              alt={message.sender.name}
                            />
                            <AvatarFallback className="text-xs">
                              {message.sender.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    {/* Message content */}
                    <div
                      className={cn(
                        'max-w-[70%] flex-1',
                        isOwnMessage && 'flex flex-col items-end'
                      )}
                    >
                      {/* Sender name for group messages */}
                      {showName && message.sender && !isOwnMessage && (
                        <div className="mb-1 text-sm font-medium text-foreground">
                          {message.sender.name}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className="group/message relative">
                        <div
                          className={cn(
                            'break-words rounded-lg px-3 py-2 text-sm',
                            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted',
                            isConsecutive && 'mt-1'
                          )}
                        >
                          {/* Reply to message */}
                          {message.replyTo && (
                            <div
                              className={cn(
                                'mb-2 border-l-2 pl-3 text-xs',
                                isOwnMessage
                                  ? 'border-primary-foreground/50'
                                  : 'border-muted-foreground'
                              )}
                            >
                              <div className="font-medium">{message.replyTo.sender.name}</div>
                              <div className="truncate">{message.replyTo.content}</div>
                            </div>
                          )}

                          {/* Message content */}
                          <p>{message.isDeleted ? 'Message deleted' : message.content}</p>

                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="overflow-hidden rounded">
                                  {attachment.mimeType.startsWith('image/') ? (
                                    <img
                                      src={attachment.fileUrl}
                                      alt={attachment.fileName}
                                      className="max-h-64 max-w-full rounded object-contain"
                                    />
                                  ) : (
                                    <a
                                      href={attachment.fileUrl}
                                      download={attachment.fileName}
                                      className="flex items-center gap-2 rounded bg-background/50 p-2 text-sm"
                                    >
                                      <span>{attachment.fileName}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({(attachment.fileSize / 1024).toFixed(1)} KB)
                                      </span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Message reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {message.reactions.map((reaction, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-xs',
                                    'bg-background/90 shadow-sm backdrop-blur-sm'
                                  )}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-muted-foreground">
                                    {message.reactions?.filter((r) => r.emoji === reaction.emoji)
                                      .length || 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp and status */}
                          <div
                            className={cn(
                              'mt-1 flex items-center gap-1 text-xs',
                              isOwnMessage
                                ? 'justify-end text-primary-foreground/70'
                                : 'text-muted-foreground'
                            )}
                          >
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {message.isEdited && <span className="italic">(edited)</span>}
                            {isOwnMessage && (
                              <div className="flex">
                                {/* Read receipts */}
                                {message.readReceipts && message.readReceipts.length > 0 ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <CheckCheck className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Message actions */}
                        <div className="absolute right-0 top-0 flex gap-1 opacity-0 group-hover/message:opacity-100">
                          {/* Add Reaction */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 cursor-pointer p-0"
                              >
                                <Smile className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="end">
                              <div className="flex gap-2">
                                {commonEmojis.map((emoji) => {
                                  const hasReaction = message.reactions?.some(
                                    (r) =>
                                      r.emoji === emoji &&
                                      (r.account?.id || r.accountId) === currentUserId
                                  )
                                  return (
                                    <Button
                                      key={emoji}
                                      variant={hasReaction ? 'default' : 'ghost'}
                                      size="sm"
                                      className="h-8 w-8 cursor-pointer p-0 text-lg"
                                      onClick={async () => {
                                        try {
                                          if (hasReaction) {
                                            await removeReactionMutation.mutateAsync({
                                              id: message.id,
                                              emoji,
                                            })
                                          } else {
                                            await addReactionMutation.mutateAsync({
                                              id: message.id,
                                              emoji,
                                            })
                                          }
                                        } catch (error) {
                                          handleErrorApi({ error })
                                        }
                                      }}
                                    >
                                      {emoji}
                                    </Button>
                                  )
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 cursor-pointer p-0"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content)
                                  toast({ description: 'Message copied to clipboard' })
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </DropdownMenuItem>
                              {isOwnMessage && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => {
                                      setEditingMessageId(message.id)
                                      setEditingMessageContent(message.content)
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-destructive"
                                    onClick={() => setDeletingMessageId(message.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex gap-3">
            <div className="w-8" />
            <div className="max-w-[70%] flex-1">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {typingUsers.length === 1
                  ? 'Someone is typing...'
                  : `${typingUsers.length} people are typing...`}
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Edit Message Dialog */}
      <EditMessageDialog
        open={editingMessageId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMessageId(null)
        }}
        messageId={editingMessageId}
        currentContent={editingMessageContent}
        onSuccess={() => {
          setEditingMessageId(null)
          setEditingMessageContent('')
        }}
      />

      {/* Delete Message Confirmation */}
      <AlertDialog
        open={deletingMessageId !== null}
        onOpenChange={(open) => !open && setDeletingMessageId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingMessageId) {
                  try {
                    await deleteMutation.mutateAsync(deletingMessageId)
                    toast({ description: 'Message deleted successfully' })
                    setDeletingMessageId(null)
                  } catch (error) {
                    handleErrorApi({ error })
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
