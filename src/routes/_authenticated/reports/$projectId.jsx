import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import i18n from '@/shared/i18n'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { ReportDocument } from '@/features/reports/ReportDocument'
import { projectQuery } from '@/features/projects/api'
import { PageSkeleton } from '@/shared/components/States'

export const Route = createFileRoute('/_authenticated/reports/$projectId')({
  head: pageHead(({ loaderData }) => `${loaderData?.name ?? i18n.t('titles.project')} · ${i18n.t('titles.report')}`),
  validateSearch: z.object({ type: z.enum(['client', 'qs']).default('client').catch('client') }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(projectQuery(params.projectId)),
  pendingComponent: PageSkeleton,
  component: ReportRoute,
})

function ReportRoute() {
  const { projectId } = Route.useParams()
  const { type } = Route.useSearch()
  const { data } = useSuspenseQuery(projectQuery(projectId))
  return <ReportDocument project={data} type={type} />
}
