import { create } from 'zustand'

/** Minimal typing for the non-standard beforeinstallprompt event. */

export const usePwaStore = create()((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  installEvent: null,
  installed: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches,
  setOnline: (online) => set({ online }),
  setInstallEvent: (installEvent) => set({ installEvent }),
  setInstalled: (installed) => set({ installed }),
}))
