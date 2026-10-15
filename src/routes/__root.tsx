import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import type { RouterContext } from '@/app/router'
import { AppShell } from '@/shared/components/AppShell'
import { ServiceWorkerPrompt } from '@/pwa/ServiceWorkerPrompt'

const devtoolsEnabled = import.meta.env.DEV && import.meta.env.VITE_DEVTOOLS !== 'false'
const Devtools = devtoolsEnabled
  ? lazy(async () => {
      const [{ TanStackRouterDevtools }, { ReactQueryDevtools }] = await Promise.all([
        import('@tanstack/react-router-devtools'),
        import('@tanstack/react-query-devtools'),
      ])
      return {
        default: () => (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </>
        ),
      }
    })
  : null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
      <ServiceWorkerPrompt />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </AppShell>
  )
}
