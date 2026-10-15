import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogueApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'
import type { PriceDecision, PriceSubmissionInput } from '@/shared/api/schemas'

export type PriceFilters = { status?: string; category?: string; q?: string }
export const pricesQuery = (filters: PriceFilters) => queryOptions({ queryKey: qk.prices(filters), queryFn: () => catalogueApi.prices(filters) })
export const usePrices = (filters: PriceFilters) => useQuery(pricesQuery(filters))

export function useSubmitPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PriceSubmissionInput) => catalogueApi.submit(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['catalogue'] }),
  })
}

export function useDecidePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: PriceDecision }) => catalogueApi.decide(id, decision),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalogue'] })
      void qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
