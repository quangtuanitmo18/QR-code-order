'use client'

import Image from 'next/image'

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import { cn, handleErrorApi } from '@/lib/utils'
import {
  useAddReactionMutation,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useRemoveReactionMutation,
} from '@/queries/useMessage'
import { MessageType } from '@/schemaValidations/message.schema'
import { useChatStore } from '@/store/useChatStore'
import { format } from 'date-fns'
import { CheckCheck, Copy, MoreHorizontal, Reply, Smile, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { CallMessageBubble } from './call-message-bubble'
import { EditMessageDialog } from './edit-message-dialog'

const EMPTY_TYPING_USERS: number[] = []

interface MessageListProps {
  messages: MessageType[]
  currentUserId: number | null
  typingUsers?: number[]
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function MessageList({
  messages,
  currentUserId,
  typingUsers = EMPTY_TYPING_USERS,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: MessageListProps) {
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
      return format(date, 'HH:mm')
    }
    return format(date, 'MMM d, HH:mm')
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    if (format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
      return 'Today'
    } else if (
      format(date, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
    ) {
      return 'Yesterday'
    }
    return format(date, 'EEEE, MMMM d')
  }

  const setReplyingTo = useChatStore((state) => state.setReplyingTo)

  const items = useMemo(() => {
    const flattened: any[] = []
    let currentDate = ''

    messages.forEach((message, index) => {
      const messageDate = format(new Date(message.createdAt), 'yyyy-MM-dd')
      if (messageDate !== currentDate) {
        currentDate = messageDate
        flattened.push({ type: 'date', id: `date-${currentDate}`, date: currentDate })
      }

      // Figure out avatar and name visibility
      const prevMessage = index > 0 ? messages[index - 1] : null
      const isConsecutive =
        prevMessage &&
        prevMessage.senderId === message.senderId &&
        new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() <
          5 * 60 * 1000

      // We show avatar/name if it's the first message of the day or not consecutive
      const startOfDayOrNewSender =
        !prevMessage ||
        prevMessage.senderId !== message.senderId ||
        format(new Date(prevMessage.createdAt), 'yyyy-MM-dd') !== messageDate

      const showAvatar = message.senderId !== currentUserId && startOfDayOrNewSender
      const showName = message.senderId !== currentUserId && startOfDayOrNewSender

      flattened.push({
        type: 'message',
        message,
        showAvatar,
        showName,
        isConsecutive: isConsecutive && !startOfDayOrNewSender,
      })
    })

    // Optionally append typing indicator as an item if we want it in the virtualized list
    if (typingUsers.length > 0) {
      flattened.push({ type: 'typing', id: 'typing-indicator' })
    }

    return flattened
  }, [messages, currentUserId, typingUsers])

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden">
      <Virtuoso
        style={{ overflowX: 'hidden' }}
        className="w-full flex-1 px-4"
        data={items}
        startReached={onLoadMore}
        initialTopMostItemIndex={items.length - 1} // Scroll to the bottom on mount
        followOutput="smooth" // Auto scroll to bottom when new item added
        computeItemKey={(index, item) => item.id || item.message?.id || index}
        components={{
          Header: () =>
            isLoadingMore ? (
              <div className="flex justify-center p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : null,
        }}
        itemContent={(index, item) => {
          if (item.type === 'date') {
            return (
              <div className="my-2 flex items-center justify-center py-4">
                <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  {formatDateHeader(item.date)}
                </div>
              </div>
            )
          }

          if (item.type === 'typing') {
            return (
              <div className="flex gap-3 py-2">
                <div className="w-8" />
                <div className="max-w-[70%] flex-1">
                  <div className="animate-pulse rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {typingUsers.length === 1
                      ? 'Someone is typing...'
                      : `${typingUsers.length} people are typing...`}
                  </div>
                </div>
              </div>
            )
          }

          if (item.type === 'message') {
            const { message, showAvatar, showName, isConsecutive } = item
            const isOwnMessage = message.senderId === currentUserId

            if (message.isDeleted && !isOwnMessage) {
              return (
                <div className={cn('group flex gap-3 py-1', isOwnMessage && 'flex-row-reverse')}>
                  <div className="max-w-[70%] flex-1">
                    <div className="px-3 py-2 text-sm italic text-muted-foreground">
                      Message deleted
                    </div>
                  </div>
                </div>
              )
            }

            // Call messages: render a special centered bubble
            if (message.type === 'call' && message.callMeta) {
              return (
                <CallMessageBubble
                  callMeta={message.callMeta}
                  isOwnMessage={isOwnMessage}
                  timestamp={message.createdAt}
                />
              )
            }

            return (
              <div
                className={cn(
                  'group flex gap-3',
                  isOwnMessage && 'flex-row-reverse',
                  !isConsecutive ? 'mt-4' : 'mt-1'
                )}
              >
                {/* Avatar */}
                {!isOwnMessage && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar && message.sender && (
                      <Avatar className="h-8 w-8 cursor-pointer border shadow-sm">
                        <AvatarImage
                          src={message.sender.avatar || undefined}
                          alt={message.sender.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-xs uppercase text-primary">
                          {message.sender.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                {/* Message content */}
                <div
                  className={cn(
                    'w-fit max-w-[75%]',
                    isOwnMessage && 'ml-auto flex flex-col items-end'
                  )}
                >
                  {/* Sender name for group messages */}
                  {showName && message.sender && !isOwnMessage && (
                    <div className="mb-1 ml-1 text-xs font-semibold text-muted-foreground">
                      {message.sender.name}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className="group/message relative flex w-full flex-col">
                    <div
                      className={cn(
                        'break-words px-4 py-2.5 text-[15px] shadow-sm',
                        isOwnMessage
                          ? 'rounded-2xl rounded-tr-sm bg-primary text-primary-foreground'
                          : 'rounded-2xl rounded-tl-sm border bg-muted/60 text-foreground'
                      )}
                    >
                      {/* Reply to message */}
                      {message.replyTo && (
                        <div
                          className={cn(
                            'mb-2 border-l-2 pl-3 text-sm opacity-90',
                            isOwnMessage
                              ? 'border-primary-foreground/50'
                              : 'border-muted-foreground/50'
                          )}
                        >
                          <div className="mb-1 text-xs font-semibold">
                            {message.replyTo.sender?.name || 'User'}
                          </div>
                          <div className="white-space-normal line-clamp-2 truncate text-xs">
                            {message.replyTo.content}
                          </div>
                        </div>
                      )}

                      {/* Message content */}
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.isDeleted ? 'Message deleted' : message.content}
                      </p>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment: any) => (
                            <div key={attachment.id} className="overflow-hidden rounded-lg">
                              {attachment.mimeType.startsWith('image/') ? (
                                <Image
                                  src={attachment.fileUrl}
                                  alt={attachment.fileName}
                                  width={400}
                                  height={256}
                                  className="max-h-64 max-w-full rounded-lg object-contain"
                                  unoptimized
                                />
                              ) : (
                                <a
                                  href={attachment.fileUrl}
                                  download={attachment.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-background/50 p-2 text-sm transition-colors hover:bg-background/80"
                                >
                                  <span className="truncate font-medium">
                                    {attachment.fileName}
                                  </span>
                                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                                    ({(attachment.fileSize / 1024).toFixed(1)} KB)
                                  </span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div
                        className={cn(
                          'relative z-10 mt-1 flex flex-wrap gap-1',
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.reactions.map((reaction: any, idx: number) => (
                          <div
                            key={`${reaction.emoji}-${reaction.account?.id ?? reaction.accountId ?? idx}`}
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
                              'bg-background shadow-sm transition-colors hover:bg-muted'
                            )}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="font-medium text-muted-foreground">
                              {message.reactions?.filter((r: any) => r.emoji === reaction.emoji)
                                .length || 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp and status */}
                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1 text-[11px] font-medium tracking-wide',
                        isOwnMessage
                          ? 'justify-end text-muted-foreground/80'
                          : 'ml-1 text-muted-foreground/80'
                      )}
                    >
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {message.isEdited && <span className="italic">Edited</span>}
                      {message.id < 0 && <span className="italic text-primary/70">Sending...</span>}
                      {isOwnMessage && message.id > 0 && (
                        <div className="ml-1 flex">
                          {message.readReceipts && message.readReceipts.length > 0 ? (
                            <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <CheckCheck className="h-3.5 w-3.5" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message actions */}
                    {message.id > 0 && (
                      <div
                        className={cn(
                          'absolute top-0 flex gap-1 rounded-lg border bg-background/50 p-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover/message:opacity-100',
                          isOwnMessage ? '-left-20' : '-right-20'
                        )}
                      >
                        {/* Add Reaction */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm">
                              <Smile className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto border-border/50 p-2"
                            align={isOwnMessage ? 'end' : 'start'}
                          >
                            <div className="flex gap-1.5">
                              {commonEmojis.map((emoji) => {
                                const hasReaction = message.reactions?.some(
                                  (r: any) =>
                                    r.emoji === emoji &&
                                    (r.account?.id || r.accountId) === currentUserId
                                )
                                return (
                                  <Button
                                    key={emoji}
                                    variant={hasReaction ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-lg"
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
                                        // Silent fail or toast
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => setReplyingTo(message)}
                            >
                              <Reply className="mr-2 h-4 w-4" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(message.content)
                                toast({ description: 'Copied to clipboard', duration: 2000 })
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
                                  className="cursor-pointer text-destructive focus:text-destructive"
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
                    )}
                  </div>
                </div>
              </div>
            )
          }

          return null
        }}
      />

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
