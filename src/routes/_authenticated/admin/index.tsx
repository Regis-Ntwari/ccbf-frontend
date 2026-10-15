import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminHome } from '@/features/admin/AdminHome'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/admin/')({
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'admin_panel')) throw redirect({ to: '/' })
  },
  component: AdminHome,
})
