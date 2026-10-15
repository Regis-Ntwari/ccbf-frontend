import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Client-side scenario comparison tray (Feature 11), max 4 entries. */
export const useScenarioStore = create()(
  persist(
    (set) => ({
      compare: [],
      add: (e) =>
        set((s) => {
          if (s.compare.some((c) => c.estimateId === e.estimateId)) return s
          return { compare: [...s.compare, e].slice(-4) }
        }),
      remove: (id) => set((s) => ({ compare: s.compare.filter((c) => c.estimateId !== id) })),
      clear: () => set({ compare: [] }),
    }),
    { name: 'ccbf-compare' },
  ),
)
