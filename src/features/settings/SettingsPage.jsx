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

import { can, roleLabel } from '@/shared/lib/permissions'
import { LOCALE_LABEL } from '@/shared/i18n'
import { USE_MOCK } from '@/shared/api/client'
import { ENGINE_VERSION, PRICE_SNAPSHOT_ID } from '@/mocks/engine/rules'
import { useConfig } from '@/features/config/api'

export function SettingsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const ui = useUiStore()
  const user = useCurrentUser()
  const online = usePwaStore((s) => s.online)
  const installed = usePwaStore((s) => s.installed)
  const resetWizard = useWizardStore((s) => s.reset)
  const clearCompare = useScenarioStore((s) => s.clear)
  const config = useConfig()

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
            <Typography variant="h5" gutterBottom>
              {t('shell.settings.appearance')}
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('shell.settings.language')}
                </Typography>
                <ToggleButtonGroup exclusive value={ui.locale} onChange={(_, v) => v && ui.setLocale(v)}>
                  <ToggleButton value="en">{LOCALE_LABEL.en}</ToggleButton>
                  <ToggleButton value="rw">{LOCALE_LABEL.rw}</ToggleButton>
                  <ToggleButton value="fr">{LOCALE_LABEL.fr}</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('shell.settings.theme')}
                </Typography>
                <ToggleButtonGroup exclusive value={ui.colorMode} onChange={(_, v) => v && ui.setColorMode(v)}>
                  <ToggleButton value="system">{t('shell.settings.themeSystem')}</ToggleButton>
                  <ToggleButton value="light">{t('shell.settings.themeLight')}</ToggleButton>
                  <ToggleButton value="dark">{t('shell.settings.themeDark')}</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {can(user, 'professional_mode') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('mode.label')}
                  </Typography>
                  <ToggleButtonGroup exclusive value={ui.mode} onChange={(_, v) => v && ui.setMode(v)}>
                    <ToggleButton value="client">{t('mode.client')}</ToggleButton>
                    <ToggleButton value="professional">{t('mode.professional')}</ToggleButton>
                    {can(user, 'enterprise_mode') && (
                      <ToggleButton value="enterprise">{t('mode.enterprise')}</ToggleButton>
                    )}
                  </ToggleButtonGroup>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {t('shell.settings.modeHint')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {t('shell.settings.account')}
            </Typography>
            {user ? (
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography>
                  {user.name} · {user.email}
                </Typography>
                <Chip size="small" label={roleLabel(t, user.role)} />
                {user.companyName && <Chip size="small" variant="outlined" label={user.companyName} />}
                {user.grants.map((g) => (
                  <Chip
                    key={g}
                    size="small"
                    color="info"
                    variant="outlined"
                    label={t(`shell.grants.${g}`, { defaultValue: g.replace('_', ' ') })}
                  />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">{t('shell.settings.notSignedIn')}</Typography>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {t('shell.settings.offlineApp')}
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <Chip
                size="small"
                color={online ? 'success' : 'warning'}
                label={online ? t('shell.settings.online') : t('shell.settings.offline')}
              />
              <Chip
                size="small"
                variant="outlined"
                label={installed ? t('shell.settings.installed') : t('shell.settings.inBrowser')}
              />
              <Chip
                size="small"
                variant="outlined"
                label={USE_MOCK ? t('shell.settings.mockBackend') : t('shell.settings.liveApi')}
              />
            </Stack>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              <InstallButton />
              <Button variant="outlined" onClick={clearCache}>
                {t('shell.settings.clearCache')}
              </Button>
              {USE_MOCK && (
                <Button variant="outlined" color="warning" onClick={() => void resetMock()}>
                  {t('shell.settings.resetDemo')}
                </Button>
              )}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              {t('shell.settings.versionLine', {
                engine: ENGINE_VERSION,
                config: config.data?.version ?? '…',
                snapshot: PRICE_SNAPSHOT_ID,
                app: __APP_VERSION__,
              })}
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
