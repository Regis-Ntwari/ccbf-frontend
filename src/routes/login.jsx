import { createFileRoute, redirect } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { z } from 'zod'
import { LoginPage } from '@/features/auth/LoginPage'

export const Route = createFileRoute('/login')({
  head: pageHead('titles.login'),
  staticData: { crumb: 'titles.login' },
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.user)
      throw redirect({ to: search.redirect && search.redirect.startsWith('/') ? search.redirect : '/overview' })
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect: to } = Route.useSearch()
  return <LoginPage redirect={to} />
}
