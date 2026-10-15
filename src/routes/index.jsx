import { createFileRoute, redirect } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { HomePage } from '@/features/home/HomePage'
import { configQuery } from '@/features/config/api'

/** Public homepage. Signed-in users land on their overview instead. */
export const Route = createFileRoute('/')({
  head: pageHead(null),
  staticData: { crumb: 'titles.home' },
  beforeLoad: ({ context }) => {
    if (context.auth.user) throw redirect({ to: '/overview' })
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(configQuery),
  component: HomePage,
})
