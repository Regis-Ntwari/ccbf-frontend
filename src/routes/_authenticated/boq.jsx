import { createFileRoute, redirect } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { BoqIndexPage } from '@/features/boq/BoqIndexPage'
import { boqsQuery } from '@/features/boq/api'
import { can } from '@/shared/lib/permissions'

export const Route = createFileRoute('/_authenticated/boq')({
  head: pageHead('titles.boq'),
  staticData: { crumb: 'titles.boq' },
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'view_rates')) throw redirect({ to: '/overview' })
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(boqsQuery),
  component: BoqIndexPage,
})
