import { createRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { User } from '@/shared/api/schemas'
import { routeTree } from '@/routeTree.gen'
import { queryClient } from './queryClient'
import { RouteError } from '@/shared/components/RouteError'
import { NotFound } from '@/shared/components/NotFound'

export interface RouterContext {
  queryClient: QueryClient
  auth: { user: User | null }
}

export const router = createRouter({
  routeTree,
  context: { queryClient, auth: { user: null } },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
