import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import LanguageIcon from '@mui/icons-material/Language'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useState } from 'react'
import { useUiStore } from '@/shared/stores'
import { LOCALE_LABEL } from '@/shared/i18n'

import { OfflineBanner } from '@/pwa/OfflineBanner'
import { Wordmark } from './Wordmark'
import { FONT_MONO } from '@/shared/theme/theme'
import { useConfig } from '@/features/config/api'

/** Shell for visitors: no sidebar, compact top bar, editorial footer. */
export function PublicShell({ children }) {
  const { t } = useTranslation()
  const colorMode = useUiStore((s) => s.colorMode)
  const setColorMode = useUiStore((s) => s.setColorMode)
  const locale = useUiStore((s) => s.locale)
  const setLocale = useUiStore((s) => s.setLocale)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [langAnchor, setLangAnchor] = useState(null)
  const config = useConfig()
  const locales = config.data?.localization.enabledLocales ?? ['en', 'rw', 'fr']
  const isHome = pathname === '/'
  const links = [
    { to: '/', label: t('titles.estimate') },
    { to: '/budget', label: t('nav.budget') },
    { to: '/reach', label: t('nav.reach') },
    { to: '/cost-to-complete', label: t('nav.complete') },
  ]
  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        className="no-print"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 52, gap: 1, width: '100%', px: { xs: 2, md: 4 } }}>
          <Box component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', mr: 3 }}>
            <Wordmark />
          </Box>
          <Stack direction="row" sx={{ gap: 0.5, display: { xs: 'none', md: 'flex' } }}>
            {links.map((l) => {
              const active = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to)
              return (
                <Button
                  key={l.to}
                  component={Link}
                  to={l.to}
                  size="small"
                  color="inherit"
                  sx={{
                    fontWeight: active ? 600 : 500,
                    color: active ? 'text.primary' : 'text.secondary',
                    borderBottom: active ? '2px solid' : '2px solid transparent',
                    borderColor: active ? 'secondary.main' : 'transparent',
                    borderRadius: 0,
                  }}
                >
                  {l.label}
                </Button>
              )
            })}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" aria-label={t('shell.nav.language')} onClick={(e) => setLangAnchor(e.currentTarget)}>
            <LanguageIcon fontSize="small" />
          </IconButton>
          <Menu open={Boolean(langAnchor)} anchorEl={langAnchor} onClose={() => setLangAnchor(null)}>
            {locales.map((l) => (
              <MenuItem
                key={l}
                selected={l === locale}
                onClick={() => {
                  setLocale(l)
                  setLangAnchor(null)
                }}
              >
                {LOCALE_LABEL[l] ?? l}
              </MenuItem>
            ))}
          </Menu>
          <IconButton
            size="small"
            aria-label={t('shell.nav.toggleTheme')}
            onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
          >
            {colorMode === 'dark' ? (
              <LightModeOutlinedIcon fontSize="small" />
            ) : (
              <DarkModeOutlinedIcon fontSize="small" />
            )}
          </IconButton>
          <Button component={Link} to="/login" variant="contained" size="small" sx={{ ml: 1 }}>
            {t('nav.login')}
          </Button>
        </Toolbar>
      </AppBar>
      <OfflineBanner />
      <Box
        component="main"
        sx={{ flex: 1, width: '100%', px: isHome ? 0 : { xs: 2, md: 4, xl: 6 }, py: isHome ? 0 : { xs: 3, md: 4 } }}
      >
        {children}
      </Box>
      <Box component="footer" className="no-print" sx={{ borderTop: 1, borderColor: 'divider', mt: isHome ? 0 : 6 }}>
        <Box
          sx={{
            px: { xs: 2, md: 4, xl: 6 },
            py: 3,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Wordmark compact />
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 720 }}>
            {config.data?.branding.footerDisclaimer ?? ''}
          </Typography>
          <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: 'text.disabled' }}>
            v{__APP_VERSION__}
          </Typography>
        </Box>
        <Divider />
      </Box>
    </Box>
  )
}
