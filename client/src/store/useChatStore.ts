import { MessageType } from '@/schemaValidations/message.schema'
import { create } from 'zustand'

type ChatStoreType = {
  replyingTo: MessageType | null
  editingMessage: MessageType | null
  typingUsers: number[]
  searchQuery: string
  
  // Actions
  setReplyingTo: (message: MessageType | null) => void
  setEditingMessage: (message: MessageType | null) => void
  setTypingUsers: (users: number[]) => void
  addTypingUser: (userId: number) => void
  removeTypingUser: (userId: number) => void
  setSearchQuery: (query: string) => void
  clearChatState: () => void
}

export const useChatStore = create<ChatStoreType>((set) => ({
  replyingTo: null,
  editingMessage: null,
  typingUsers: [],
  searchQuery: '',

  setReplyingTo: (message) => set({ replyingTo: message }),
  setEditingMessage: (message) => set({ editingMessage: message }),
  
  setTypingUsers: (users) => set({ typingUsers: users }),
  
  addTypingUser: (userId) => 
    set((state) => {
      if (!state.typingUsers.includes(userId)) {
        return { typingUsers: [...state.typingUsers, userId] }
      }
      return state
    }),

  removeTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter(id => id !== userId)
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearChatState: () => set({
    replyingTo: null,
    editingMessage: null,
    typingUsers: [],
    searchQuery: ''
  })
}))
