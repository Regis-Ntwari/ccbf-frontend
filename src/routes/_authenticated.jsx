import { createFileRoute, redirect } from '@tanstack/react-router'

/** Pathless layout: everything under it requires a signed-in user. */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
})
