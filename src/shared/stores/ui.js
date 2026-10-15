import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Three UX modes over one engine (Section 1.3). */

export const useUiStore = create()(
  persist(
    (set) => ({
      mode: 'client',
      colorMode: 'system',
      locale: 'en',
      navOpen: false,
      setMode: (mode) => set({ mode }),
      setColorMode: (colorMode) => set({ colorMode }),
      setLocale: (locale) => set({ locale }),
      setNavOpen: (navOpen) => set({ navOpen }),
      toggleNav: () => set((s) => ({ navOpen: !s.navOpen })),
    }),
    { name: 'ccbf-ui', partialize: (s) => ({ mode: s.mode, colorMode: s.colorMode, locale: s.locale }) },
  ),
)
