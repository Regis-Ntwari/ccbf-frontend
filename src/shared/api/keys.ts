import type { EstimateParams } from './schemas'

/** Query-key factory: one place to reason about cache identity and invalidation. */
export const qk = {
  locations: ['locations'] as const,
  me: ['auth', 'me'] as const,
  estimate: (id: string) => ['estimates', id] as const,
  estimateRun: (params: EstimateParams) => ['estimates', 'run', params] as const,
  trace: (estimateId: string, figureId: string) => ['estimates', estimateId, 'trace', figureId] as const,
  reverse: (budget: number, locationId: string, typology: string, ownsLand: boolean) =>
    ['estimates', 'reverse', { budget, locationId, typology, ownsLand }] as const,
  stageReach: (params: EstimateParams, budget: number) => ['estimates', 'stage-reach', params, budget] as const,
  costToComplete: (input: unknown) => ['estimates', 'cost-to-complete', input] as const,
  projects: (q?: string) => ['projects', { q: q ?? '' }] as const,
  project: (id: string) => ['projects', id] as const,
  scenarios: (projectId: string) => ['projects', projectId, 'scenarios'] as const,
  boq: (projectId: string) => ['projects', projectId, 'boq'] as const,
  prices: (filters: { status?: string; category?: string; q?: string }) => ['catalogue', 'prices', filters] as const,
}
