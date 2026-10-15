import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { SettingsPage } from '@/features/settings/SettingsPage'

export const Route = createFileRoute('/settings')({
  head: pageHead('titles.settings'),
  component: SettingsPage,
})
