import { createFileRoute, redirect } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { SubmissionsPage } from '@/features/admin/SubmissionsPage'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/admin/submissions')({
  head: pageHead('titles.submissions'),
  staticData: { crumb: 'titles.submissions' },
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'approve_global_prices')) throw redirect({ to: '/admin' })
  },
  component: SubmissionsPage,
})
