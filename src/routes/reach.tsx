import { createFileRoute } from '@tanstack/react-router'
import { StageReachPage } from '@/features/reach/StageReachPage'
import { locationsQuery } from '@/features/estimate/api'

export const Route = createFileRoute('/reach')({
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: StageReachPage,
})
