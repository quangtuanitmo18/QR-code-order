import { useAppStore } from '@/store/useAppStore'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('useAppStore', () => {
  afterEach(() => {
    // Reset store between tests
    useAppStore.setState({
      isAuth: false,
      role: undefined,
      socket: undefined,
    })
  })

  it('has correct initial state', () => {
    const state = useAppStore.getState()
    expect(state.isAuth).toBe(false)
    expect(state.role).toBeUndefined()
    expect(state.socket).toBeUndefined()
  })

  it('setRole sets role and isAuth to true', () => {
    useAppStore.getState().setRole('Owner')
    const state = useAppStore.getState()
    expect(state.role).toBe('Owner')
    expect(state.isAuth).toBe(true)
  })

  it('setRole with Employee', () => {
    useAppStore.getState().setRole('Employee')
    expect(useAppStore.getState().role).toBe('Employee')
    expect(useAppStore.getState().isAuth).toBe(true)
  })

  it('setRole with undefined clears auth and removes tokens', () => {
    // First set a role
    useAppStore.getState().setRole('Owner')
    expect(useAppStore.getState().isAuth).toBe(true)

    // Then clear it
    useAppStore.getState().setRole(undefined)
    expect(useAppStore.getState().role).toBeUndefined()
    expect(useAppStore.getState().isAuth).toBe(false)
  })

  it('setSocket stores socket reference', () => {
    const mockSocket = { on: vi.fn(), disconnect: vi.fn() } as any
    useAppStore.getState().setSocket(mockSocket)
    expect(useAppStore.getState().socket).toBe(mockSocket)
  })

  it('disconnectSocket calls disconnect and clears socket', () => {
    const mockDisconnect = vi.fn()
    const mockSocket = { on: vi.fn(), disconnect: mockDisconnect } as any

    useAppStore.getState().setSocket(mockSocket)
    useAppStore.getState().disconnectSocket()

    expect(mockDisconnect).toHaveBeenCalled()
    expect(useAppStore.getState().socket).toBeUndefined()
  })

  it('disconnectSocket when no socket does nothing', () => {
    // Should not throw
    expect(() => useAppStore.getState().disconnectSocket()).not.toThrow()
    expect(useAppStore.getState().socket).toBeUndefined()
  })
})
