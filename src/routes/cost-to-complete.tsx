import { createFileRoute } from '@tanstack/react-router'
import { CostToCompletePage } from '@/features/complete/CostToCompletePage'
import { locationsQuery } from '@/features/estimate/api'

export const Route = createFileRoute('/cost-to-complete')({
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: CostToCompletePage,
})
