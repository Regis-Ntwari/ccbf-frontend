import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { OverviewPage } from '@/features/dashboard/OverviewPage'
import { dashboardQuery } from '@/features/dashboard/api'

export const Route = createFileRoute('/_authenticated/overview')({
  head: pageHead('titles.overview'),
  staticData: { crumb: 'titles.overview' },
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: OverviewPage,
})
