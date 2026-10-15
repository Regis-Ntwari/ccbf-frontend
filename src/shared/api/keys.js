/** Query-key factory: one place to reason about cache identity and invalidation. */
export const qk = {
  locations: ['locations'],
  config: ['config'],
  adminConfig: ['admin', 'config'],
  me: ['auth', 'me'],
  estimate: (id) => ['estimates', id],
  estimateRun: (params) => ['estimates', 'run', params],
  trace: (estimateId, figureId) => ['estimates', estimateId, 'trace', figureId],
  reverse: (budget, locationId, typology, ownsLand) => [
    'estimates',
    'reverse',
    { budget, locationId, typology, ownsLand },
  ],
  stageReach: (params, budget) => ['estimates', 'stage-reach', params, budget],
  costToComplete: (input) => ['estimates', 'cost-to-complete', input],
  projects: (q) => ['projects', { q: q ?? '' }],
  project: (id) => ['projects', id],
  scenarios: (projectId) => ['projects', projectId, 'scenarios'],
  boq: (projectId) => ['projects', projectId, 'boq'],
  boqs: ['boqs'],
  dashboard: ['dashboard'],
  prices: (filters) => ['catalogue', 'prices', filters],
}
