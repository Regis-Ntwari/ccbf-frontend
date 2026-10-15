import { create } from 'zustand'

/** Minimal typing for the non-standard beforeinstallprompt event. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PwaState {
  online: boolean
  installEvent: BeforeInstallPromptEvent | null
  installed: boolean
  setOnline: (v: boolean) => void
  setInstallEvent: (e: BeforeInstallPromptEvent | null) => void
  setInstalled: (v: boolean) => void
}

export const usePwaStore = create<PwaState>()((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  installEvent: null,
  installed: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches,
  setOnline: (online) => set({ online }),
  setInstallEvent: (installEvent) => set({ installEvent }),
  setInstalled: (installed) => set({ installed }),
}))
