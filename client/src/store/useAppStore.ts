import { removeTokensFromLocalStorage } from '@/lib/utils'
import { RoleType } from '@/types/jwt.types'
import type { Socket } from 'socket.io-client'
import { create } from 'zustand'

type AppStoreType = {
  isAuth: boolean
  role: RoleType | undefined
  setRole: (role?: RoleType | undefined) => void
  socket: Socket | undefined
  setSocket: (socket?: Socket | undefined) => void
  disconnectSocket: () => void
}

export const useAppStore = create<AppStoreType>((set) => ({
  isAuth: false,
  role: undefined as RoleType | undefined,
  setRole: (role?: RoleType | undefined) => {
    set({ role, isAuth: Boolean(role) })
    if (!role) {
      removeTokensFromLocalStorage()
    }
  },
  socket: undefined as Socket | undefined,
  setSocket: (socket?: Socket | undefined) => set({ socket }),
  disconnectSocket: () =>
    set((state) => {
      state.socket?.disconnect()
      return { socket: undefined }
    }),
}))
