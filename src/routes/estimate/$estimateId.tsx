import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { estimateQuery } from '@/features/estimate/api'
import { ResultView } from '@/features/estimate/ResultView'
import { PageSkeleton } from '@/shared/components/States'

export const Route = createFileRoute('/estimate/$estimateId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(estimateQuery(params.estimateId)),
  pendingComponent: PageSkeleton,
  component: EstimateResultRoute,
})

function EstimateResultRoute() {
  const { estimateId } = Route.useParams()
  const { data } = useSuspenseQuery(estimateQuery(estimateId))
  return <ResultView estimate={data} />
}
