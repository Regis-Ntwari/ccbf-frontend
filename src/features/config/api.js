import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi, referenceApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'

/** Public configuration: branding, homepage copy, enabled typologies/finishes/extras/locations. */
export const configQuery = queryOptions({ queryKey: qk.config, queryFn: referenceApi.config, staleTime: 5 * 60_000 })
export const useConfig = () => useQuery(configQuery)

export const adminConfigQuery = queryOptions({ queryKey: qk.adminConfig, queryFn: adminApi.config })
export const useAdminConfig = () => useQuery(adminConfigQuery)

/** Publishing a configuration version invalidates every engine-derived cache. */
function useInvalidateAll() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: qk.config })
    void qc.invalidateQueries({ queryKey: qk.adminConfig })
    void qc.invalidateQueries({ queryKey: qk.locations })
    void qc.invalidateQueries({ queryKey: ['estimates'] })
    void qc.invalidateQueries({ queryKey: ['projects'] })
    void qc.invalidateQueries({ queryKey: ['boqs'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useSaveConfig() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: (input) => adminApi.saveConfig(input), onSuccess: invalidate })
}

export function useResetConfig() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: () => adminApi.resetConfig(), onSuccess: invalidate })
}
