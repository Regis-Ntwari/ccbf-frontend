import { createFileRoute, redirect } from '@tanstack/react-router'
import { PricesPage } from '@/features/admin/PricesPage'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/admin/prices')({
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'admin_panel')) throw redirect({ to: '/' })
  },
  component: PricesPage,
})
