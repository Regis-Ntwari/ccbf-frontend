import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clear: () => set({ session: null }),
    }),
    { name: 'ccbf-auth' },
  ),
)

export const selectUser = (s) => {
  if (!s.session) return null
  if (Date.parse(s.session.expiresAt) < Date.now()) return null
  return s.session.user
}

export const useCurrentUser = () => useAuthStore(selectUser)
