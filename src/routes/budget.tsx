import { createFileRoute } from '@tanstack/react-router'
import { ReverseBudgetPage } from '@/features/budget/ReverseBudgetPage'
import { locationsQuery } from '@/features/estimate/api'

export const Route = createFileRoute('/budget')({
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: ReverseBudgetPage,
})
