import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { projectsQuery } from '@/features/projects/api'

export const Route = createFileRoute('/_authenticated/projects/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery()),
  component: ProjectsPage,
})
