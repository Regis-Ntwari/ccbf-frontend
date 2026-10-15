import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Three UX modes over one engine (Section 1.3). */
export type UiMode = 'client' | 'professional' | 'enterprise'
export type ColorMode = 'system' | 'light' | 'dark'
export type Locale = 'en' | 'rw' | 'fr'

interface UiState {
  mode: UiMode
  colorMode: ColorMode
  locale: Locale
  navOpen: boolean
  setMode: (mode: UiMode) => void
  setColorMode: (m: ColorMode) => void
  setLocale: (l: Locale) => void
  setNavOpen: (open: boolean) => void
  toggleNav: () => void
}

export const useUiStore = create<UiState>()(
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
