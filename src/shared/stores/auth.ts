import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@/shared/api/schemas'

interface AuthState {
  session: Session | null
  setSession: (s: Session) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clear: () => set({ session: null }),
    }),
    { name: 'ccbf-auth' },
  ),
)

export const selectUser = (s: AuthState): User | null => {
  if (!s.session) return null
  if (Date.parse(s.session.expiresAt) < Date.now()) return null
  return s.session.user
}

export const useCurrentUser = () => useAuthStore(selectUser)
