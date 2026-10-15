import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects')({
  staticData: { crumb: 'titles.projects' },
})
