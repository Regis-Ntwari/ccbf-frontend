import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { ReverseBudgetPage } from '@/features/budget/ReverseBudgetPage'
import { locationsQuery } from '@/features/estimate/api'

export const Route = createFileRoute('/budget')({
  head: pageHead('titles.budget'),
  staticData: { crumb: 'titles.budget' },
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: ReverseBudgetPage,
})
