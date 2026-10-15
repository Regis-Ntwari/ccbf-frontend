import { createFileRoute, redirect } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { AdminHome } from '@/features/admin/AdminHome'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/admin/')({
  head: pageHead('titles.admin'),
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'admin_panel')) throw redirect({ to: '/' })
  },
  component: AdminHome,
})
