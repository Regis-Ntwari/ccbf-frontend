import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { CostToCompletePage } from '@/features/complete/CostToCompletePage'
import { locationsQuery } from '@/features/estimate/api'

export const Route = createFileRoute('/cost-to-complete')({
  head: pageHead('titles.complete'),
  staticData: { crumb: 'titles.complete' },
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: CostToCompletePage,
})
