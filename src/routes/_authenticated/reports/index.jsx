import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { projectsQuery } from '@/features/projects/api'

export const Route = createFileRoute('/_authenticated/reports/')({
  head: pageHead('titles.reports'),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery()),
  component: ReportsPage,
})
