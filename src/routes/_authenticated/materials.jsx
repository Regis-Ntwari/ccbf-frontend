import { createFileRoute, redirect } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { PricesPage } from '@/features/admin/PricesPage'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/materials')({
  head: pageHead('titles.materials'),
  staticData: { crumb: 'titles.materials' },
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'view_rates')) throw redirect({ to: '/overview' })
  },
  component: PricesPage,
})
