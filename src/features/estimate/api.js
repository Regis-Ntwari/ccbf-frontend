import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { estimateApi, referenceApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'

export const locationsQuery = queryOptions({
  queryKey: qk.locations,
  queryFn: referenceApi.locations,
  staleTime: 1000 * 60 * 60,
})
export const estimateQuery = (id) => queryOptions({ queryKey: qk.estimate(id), queryFn: () => estimateApi.get(id) })

/**
 * Estimate runs are idempotent (same params → same id), so we model them as a
 * query keyed by params rather than a mutation. Results are seeded into the
 * per-id cache so the result page can load instantly.
 */
export function useRunEstimate(params, projectId) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: params ? qk.estimateRun(params) : ['estimates', 'run', 'none'],
    queryFn: async () => {
      const result = await estimateApi.run(params, projectId)
      qc.setQueryData(qk.estimate(result.id), result)
      return result
    },
    enabled: Boolean(params),
    placeholderData: (prev) => prev,
  })
}

export const useLocations = () => useQuery(locationsQuery)

export function useParseIntent() {
  return useMutation({ mutationFn: (text) => estimateApi.parse(text) })
}

export function useReverseBudget(req) {
  return useQuery({
    queryKey: req
      ? qk.reverse(req.budget, req.locationId, req.typology, req.ownsLand)
      : ['estimates', 'reverse', 'none'],
    queryFn: () => estimateApi.reverse(req),
    enabled: Boolean(req),
    placeholderData: (prev) => prev,
  })
}

export function useStageReach(req) {
  return useQuery({
    queryKey: req ? qk.stageReach(req.params, req.budget) : ['estimates', 'stage-reach', 'none'],
    queryFn: () => estimateApi.stageReach(req),
    enabled: Boolean(req),
    placeholderData: (prev) => prev,
  })
}

export function useCostToComplete(req) {
  return useQuery({
    queryKey: req ? qk.costToComplete(req) : ['estimates', 'cost-to-complete', 'none'],
    queryFn: () => estimateApi.costToComplete(req),
    enabled: Boolean(req),
    placeholderData: (prev) => prev,
  })
}
