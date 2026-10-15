import { createFileRoute, redirect } from '@tanstack/react-router'
import { SubmissionsPage } from '@/features/admin/SubmissionsPage'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/admin/submissions')({
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'approve_global_prices')) throw redirect({ to: '/admin' })
  },
  component: SubmissionsPage,
})
