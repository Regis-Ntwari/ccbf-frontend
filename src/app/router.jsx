import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'
import { queryClient } from './queryClient'
import { RouteError } from '@/shared/components/RouteError'
import { NotFound } from '@/shared/components/NotFound'

export const router = createRouter({
  routeTree,
  context: { queryClient, auth: { user: null } },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
})
