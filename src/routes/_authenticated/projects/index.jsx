import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { projectsQuery } from '@/features/projects/api'

export const Route = createFileRoute('/_authenticated/projects/')({
  head: pageHead('titles.projects'),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery()),
  component: ProjectsPage,
})
