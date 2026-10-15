import { queryOptions, useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'

export const dashboardQuery = queryOptions({ queryKey: qk.dashboard, queryFn: dashboardApi.get, staleTime: 30_000 })
export const useDashboard = () => useQuery(dashboardQuery)
