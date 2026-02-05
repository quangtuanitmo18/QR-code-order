'use client'

import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useChatSocket } from '@/hooks/useChatSocket'
import { decodeToken, getAccessTokenFromLocalStorage, handleErrorApi } from '@/lib/utils'
import { useGetConversationsQuery } from '@/queries/useChat'
import { useGetMessagesQuery, useSendMessageMutation } from '@/queries/useMessage'
import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatHeader } from './components/chat-header'
import { ConversationList } from './components/conversation-list'
import { CreateConversationDialog } from './components/create-conversation-dialog'
import { MessageInput } from './components/message-input'
import { MessageList } from './components/message-list'

export default function ChatClient() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Get current user ID
  const accessToken = getAccessTokenFromLocalStorage()
  const currentUserId = accessToken ? (decodeToken(accessToken).userId as number) : null

  // Fetch conversations
  const conversationsQuery = useGetConversationsQuery()
  const conversations = conversationsQuery.data?.payload.data.conversations || []

  // Fetch messages for selected conversation
  const messagesQuery = useGetMessagesQuery(
    selectedConversationId || 0,
    undefined,
    !!selectedConversationId
  )
  const messages = messagesQuery.data?.payload.data.messages || []

  // Send message mutation
  const sendMessageMutation = useSendMessageMutation()

  // WebSocket hook
  const { socket, isConnected, sendTypingStart, sendTypingStop } = useChatSocket({
    conversationId: selectedConversationId || undefined,
    onNewMessage: (message, conversationId) => {
      // Message already added to cache by useChatSocket
      // Scroll to bottom will be handled by MessageList
    },
    onTypingStart: (userId, conversationId) => {
      if (conversationId === selectedConversationId) {
        setTypingUsers((prev) => new Set(prev).add(userId))
      }
    },
    onTypingStop: (userId, conversationId) => {
      if (conversationId === selectedConversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
    },
  })

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [selectedConversationId, conversations])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const currentConversation = conversations.find((conv) => conv.id === selectedConversationId)

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!selectedConversationId || (!content.trim() && (!files || files.length === 0))) return

      try {
        await sendMessageMutation.mutateAsync({
          conversationId: selectedConversationId,
          body: {
            content: content.trim() || '',
            replyToId: null,
          },
          files: files || undefined,
        })
        // Stop typing indicator
        if (selectedConversationId) {
          sendTypingStop(selectedConversationId)
        }
      } catch (error) {
        handleErrorApi({ error })
      }
    },
    [selectedConversationId, sendMessageMutation, sendTypingStop]
  )

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!selectedConversationId) return

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      if (isTyping) {
        sendTypingStart(selectedConversationId)
        // Auto-stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingStop(selectedConversationId)
        }, 3000)
      } else {
        sendTypingStop(selectedConversationId)
      }
    },
    [selectedConversationId, sendTypingStart, sendTypingStop]
  )

  if (conversationsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full min-h-[600px] overflow-hidden rounded-lg border bg-background">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Conversations Sidebar - Responsive */}
        <div
          className={`w-100 flex-shrink-0 border-r bg-background ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:block`}
        >
          {/* Sidebar Header with Close Button (Mobile Only) */}
          <div className="flex items-center justify-between border-b bg-background p-4 lg:hidden">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            currentUserId={currentUserId}
            onSelectConversation={(id) => {
              setSelectedConversationId(id)
              setIsSidebarOpen(false) // Close sidebar on mobile after selection
            }}
            onCreateConversation={() => setIsCreateDialogOpen(true)}
          />
        </div>

        {/* Chat Panel - Flexible Width */}
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          {/* Chat Header with Hamburger Menu */}
          <div className="flex h-16 items-center border-b bg-background px-4">
            {/* Hamburger Menu Button - Only visible when sidebar is hidden on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="mr-2 cursor-pointer lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <ChatHeader
                conversation={currentConversation || null}
                currentUserId={currentUserId}
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col">
            {selectedConversationId ? (
              <>
                <MessageList
                  messages={messages}
                  currentUserId={currentUserId}
                  typingUsers={Array.from(typingUsers)}
                />

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  placeholder={`Message ${currentConversation?.name || ''}...`}
                  disabled={!isConnected || sendMessageMutation.isPending}
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold">Welcome to Chat</h3>
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Conversation Dialog */}
      <CreateConversationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={(conversationId) => {
          setSelectedConversationId(conversationId)
        }}
      />
    </TooltipProvider>
  )
}
