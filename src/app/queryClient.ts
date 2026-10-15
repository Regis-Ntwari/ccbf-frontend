import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ApiError } from '@/shared/api/client'

/**
 * One QueryClient for the app. Successful queries are persisted to localStorage
 * so results remain visible offline (PWA). Mutations are never persisted.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24, // keep a day for offline reads
      retry: (count, err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404 || err.status === 422)) return false
        return count < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})

export const queryPersister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: 'ccbf-query-cache',
  throttleTime: 1000,
})

export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7
