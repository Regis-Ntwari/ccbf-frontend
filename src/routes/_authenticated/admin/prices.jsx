import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/prices')({
  beforeLoad: () => {
    throw redirect({ to: '/materials' })
  },
})
