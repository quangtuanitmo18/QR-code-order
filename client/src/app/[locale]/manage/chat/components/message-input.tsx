'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/store/useChatStore'
import { FileText, Image as ImageIcon, Paperclip, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[], replyToId?: number) => void
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const replyingTo = useChatStore((state) => state.replyingTo)
  const setReplyingTo = useChatStore((state) => state.setReplyingTo)

  // Debounce typing indicator
  useEffect(() => {
    if (!onTyping) return

    const timeoutId = setTimeout(() => {
      if (message.trim()) {
        onTyping(true)
      } else {
        onTyping(false)
      }
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      onTyping(false)
    }
  }, [message, onTyping])

  const handleSendMessage = () => {
    const trimmedMessage = message.trim()
    if ((trimmedMessage || selectedFiles.length > 0) && !disabled) {
      onSendMessage(trimmedMessage, selectedFiles.length > 0 ? selectedFiles : undefined, replyingTo?.id)
      setMessage('')
      setSelectedFiles([])
      setReplyingTo(null)

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t p-4">
      {/* Replying to banner */}
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm border-l-2 border-primary">
          <div className="flex flex-col truncate">
            <span className="font-semibold text-xs text-primary">{replyingTo.sender.name}</span>
            <span className="truncate text-muted-foreground">{replyingTo.content}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full ml-2 cursor-pointer"
            onClick={() => setReplyingTo(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1 text-sm"
            >
              <span className="max-w-[150px] truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 cursor-pointer p-0"
                onClick={() => removeFile(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Photo or video
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        {/* Message input */}
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            disabled={disabled}
            className={cn(
              'max-h-[120px] min-h-[40px] cursor-text resize-none disabled:cursor-not-allowed',
              'pr-12' // Space for send button
            )}
            rows={1}
          />
        </div>

        {/* Send button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSendMessage}
                disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
