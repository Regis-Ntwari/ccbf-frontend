import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { ProjectPage } from '@/features/projects/ProjectPage'
import { projectQuery } from '@/features/projects/api'
import { PageSkeleton } from '@/shared/components/States'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  validateSearch: z.object({ tab: z.enum(['overview', 'scenarios', 'boq']).default('overview').catch('overview') }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(projectQuery(params.projectId)),
  pendingComponent: PageSkeleton,
  component: ProjectRoute,
})

function ProjectRoute() {
  const { projectId } = Route.useParams()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(projectQuery(projectId))
  return <ProjectPage project={data} tab={tab} onTabChange={(t) => void navigate({ search: { tab: t }, replace: true })} />
}
