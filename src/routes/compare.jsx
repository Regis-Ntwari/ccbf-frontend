import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { ComparePage } from '@/features/compare/ComparePage'

export const Route = createFileRoute('/compare')({
  head: pageHead('titles.compare'),
  component: ComparePage,
})
