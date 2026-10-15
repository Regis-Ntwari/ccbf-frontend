import { createFileRoute, redirect } from '@tanstack/react-router'
import { pageHead } from '@/shared/lib/head'
import { z } from 'zod'
import { PlatformSettingsPage } from '@/features/admin/PlatformSettingsPage'
import { adminConfigQuery } from '@/features/config/api'
import { can } from '@/shared/lib/permissions'

export const SETTINGS_TABS = [
  'branding',
  'homepage',
  'typologies',
  'finishes',
  'packages',
  'extras',
  'locations',
  'classes',
  'workflow',
  'localization',
  'history',
]

export const Route = createFileRoute('/_authenticated/admin/settings')({
  head: pageHead('titles.platformConfig'),
  staticData: { crumb: 'titles.platformConfig' },
  validateSearch: z.object({ tab: z.enum(SETTINGS_TABS).default('branding').catch('branding') }),
  beforeLoad: ({ context }) => {
    if (!can(context.auth.user, 'edit_global_rules')) throw redirect({ to: '/admin' })
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(adminConfigQuery),
  component: PlatformSettingsPage,
})
