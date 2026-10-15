import { createFileRoute, redirect } from '@tanstack/react-router'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/admin')({
  staticData: { crumb: 'titles.admin' },
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'admin_panel')) throw redirect({ to: '/overview' })
  },
})
