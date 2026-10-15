import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogueApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'

export const pricesQuery = (filters) =>
  queryOptions({ queryKey: qk.prices(filters), queryFn: () => catalogueApi.prices(filters) })
export const usePrices = (filters) => useQuery(pricesQuery(filters))

export function useSubmitPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => catalogueApi.submit(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalogue'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDecidePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision }) => catalogueApi.decide(id, decision),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalogue'] })
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}
