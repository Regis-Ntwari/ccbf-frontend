import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { EstimateParamsSchema } from '@/shared/api/schemas'

/** Questionnaire steps (Section 10). */
export const WIZARD_STEPS = [
  'what',
  'where',
  'size',
  'floors',
  'rooms',
  'finish',
  'elements',
  'extras',
  'plot',
  'budget',
]

const initialDraft = {
  storeys: 1,
  bedrooms: 3,
  bathrooms: 2,
  quality: 'STD',
  features: [],
  elementOverrides: {},
  requestedClass: 1,
}

export const useWizardStore = create()(
  persist(
    (set) => ({
      draft: initialDraft,
      step: 'what',
      freeText: '',
      prefilled: [],
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      setStep: (step) => set({ step }),
      setFreeText: (freeText) => set({ freeText }),
      setPrefilled: (prefilled) => set({ prefilled }),
      loadParams: (params) => set({ draft: params, step: 'what', prefilled: [] }),
      reset: () => set({ draft: initialDraft, step: 'what', freeText: '', prefilled: [] }),
    }),
    { name: 'ccbf-wizard', storage: createJSONStorage(() => sessionStorage) },
  ),
)

/** Parse the draft into engine params; returns issues keyed by field when invalid. */
export function finalizeDraft(draft) {
  const r = EstimateParamsSchema.safeParse(draft)
  if (r.success) return { params: r.data, errors: null }
  const errors = {}
  for (const issue of r.error.issues) errors[issue.path.join('.') || '_'] = issue.message
  return { params: null, errors }
}
