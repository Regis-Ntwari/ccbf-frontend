import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import i18n from '@/shared/i18n'
import { z } from 'zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { estimateQuery } from '@/features/estimate/api'
import { ResultView } from '@/features/estimate/ResultView'
import { PageSkeleton } from '@/shared/components/States'

export const Route = createFileRoute('/estimate/$estimateId')({
  head: pageHead(({ loaderData }) =>
    loaderData ? `${i18n.t('titles.estimate')} · ${loaderData.classLabel}` : i18n.t('titles.estimate'),
  ),
  staticData: { crumb: 'titles.estimate' },
  validateSearch: z.object({ save: z.boolean().optional().catch(undefined) }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(estimateQuery(params.estimateId)),
  pendingComponent: PageSkeleton,
  component: EstimateResultRoute,
})

function EstimateResultRoute() {
  const { estimateId } = Route.useParams()
  const { save } = Route.useSearch()
  const { data } = useSuspenseQuery(estimateQuery(estimateId))
  return <ResultView estimate={data} openSaveOnMount={Boolean(save)} />
}
