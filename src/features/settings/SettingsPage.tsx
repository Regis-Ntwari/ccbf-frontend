import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import { PageHeader } from '@/shared/components/PageHeader'
import { InstallButton } from '@/pwa/InstallButton'
import { useCurrentUser, usePwaStore, useScenarioStore, useUiStore, useWizardStore } from '@/shared/stores'
import type { ColorMode, Locale, UiMode } from '@/shared/stores'
import { can, ROLE_LABEL } from '@/shared/lib/permissions'
import { USE_MOCK } from '@/shared/api/client'
import { ENGINE_VERSION, PRICE_SNAPSHOT_ID, RULES_VERSION } from '@/mocks/engine/rules'

export function SettingsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const ui = useUiStore()
  const user = useCurrentUser()
  const online = usePwaStore((s) => s.online)
  const installed = usePwaStore((s) => s.installed)
  const resetWizard = useWizardStore((s) => s.reset)
  const clearCompare = useScenarioStore((s) => s.clear)

  const clearCache = () => {
    qc.clear()
    localStorage.removeItem('ccbf-query-cache')
    resetWizard()
    clearCompare()
  }
  const resetMock = async () => {
    const { resetMockDb } = await import('@/mocks/handlers')
    resetMockDb()
    clearCache()
  }

  return (
    <Box>
      <PageHeader title={t('nav.settings')} />
      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Appearance & language</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Language</Typography>
                <ToggleButtonGroup exclusive value={ui.locale} onChange={(_, v: Locale | null) => v && ui.setLocale(v)}>
                  <ToggleButton value="en">English</ToggleButton>
                  <ToggleButton value="rw">Kinyarwanda</ToggleButton>
                  <ToggleButton value="fr">Français</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Theme</Typography>
                <ToggleButtonGroup exclusive value={ui.colorMode} onChange={(_, v: ColorMode | null) => v && ui.setColorMode(v)}>
                  <ToggleButton value="system">System</ToggleButton>
                  <ToggleButton value="light">Light</ToggleButton>
                  <ToggleButton value="dark">Dark</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {can(user, 'professional_mode') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>{t('mode.label')}</Typography>
                  <ToggleButtonGroup exclusive value={ui.mode} onChange={(_, v: UiMode | null) => v && ui.setMode(v)}>
                    <ToggleButton value="client">{t('mode.client')}</ToggleButton>
                    <ToggleButton value="professional">{t('mode.professional')}</ToggleButton>
                    {can(user, 'enterprise_mode') && <ToggleButton value="enterprise">{t('mode.enterprise')}</ToggleButton>}
                  </ToggleButtonGroup>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Client mode hides rates, productivity, waste and preliminaries. Professional mode shows everything with traceability.</Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Account</Typography>
            {user ? (
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography>{user.name} · {user.email}</Typography>
                <Chip size="small" label={ROLE_LABEL[user.role]} />
                {user.companyName && <Chip size="small" variant="outlined" label={user.companyName} />}
                {user.grants.map((g) => <Chip key={g} size="small" color="info" variant="outlined" label={g.replace('_', ' ')} />)}
              </Stack>
            ) : (
              <Typography color="text.secondary">Not signed in. Estimates still work; sign in to save projects.</Typography>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Offline & app</Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <Chip size="small" color={online ? 'success' : 'warning'} label={online ? 'Online' : 'Offline'} />
              <Chip size="small" variant="outlined" label={installed ? 'Installed as app' : 'Running in browser'} />
              <Chip size="small" variant="outlined" label={USE_MOCK ? 'Mock backend (in-browser)' : 'Live API'} />
            </Stack>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              <InstallButton />
              <Button variant="outlined" onClick={clearCache}>Clear cached data</Button>
              {USE_MOCK && <Button variant="outlined" color="warning" onClick={() => void resetMock()}>Reset demo data</Button>}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Engine {ENGINE_VERSION} · rules {RULES_VERSION} · price snapshot {PRICE_SNAPSHOT_ID} · app {__APP_VERSION__}
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
