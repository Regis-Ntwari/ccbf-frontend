import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { PublicShell } from '@/shared/components/PublicShell'
import { NotFound } from '@/shared/components/NotFound'
import { ServiceWorkerPrompt } from '@/pwa/ServiceWorkerPrompt'
import { pageHead } from '@/shared/lib/head'
import { useCurrentUser } from '@/shared/stores'

export const Route = createRootRouteWithContext()({
  head: pageHead(null),
  component: RootLayout,
  notFoundComponent: NotFound,
})

/** Visitors get the public shell (no sidebar); signed-in users get the workspace shell. */
function RootLayout() {
  const user = useCurrentUser()
  const Shell = user ? AppShell : PublicShell
  return (
    <>
      <HeadContent />
      <Shell>
        <Outlet />
        <ServiceWorkerPrompt />
      </Shell>
    </>
  )
}
