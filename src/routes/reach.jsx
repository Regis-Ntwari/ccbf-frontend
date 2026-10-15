import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { StageReachPage } from '@/features/reach/StageReachPage'
import { locationsQuery } from '@/features/estimate/api'

export const Route = createFileRoute('/reach')({
  head: pageHead('titles.reach'),
  staticData: { crumb: 'titles.reach' },
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: StageReachPage,
})
