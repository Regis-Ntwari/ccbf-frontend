import type { ReactNode } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Badge from '@mui/material/Badge'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import LanguageIcon from '@mui/icons-material/Language'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useState } from 'react'
import { useCurrentUser, useScenarioStore, useUiStore } from '@/shared/stores'
import type { Locale, UiMode } from '@/shared/stores'
import { can } from '@/shared/lib/permissions'
import { ROLE_LABEL } from '@/shared/lib/permissions'
import { OfflineBanner } from '@/pwa/OfflineBanner'
import { InstallButton } from '@/pwa/InstallButton'
import { useLogout } from '@/features/auth/api'

const DRAWER_WIDTH = 256

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const navOpen = useUiStore((s) => s.navOpen)
  const setNavOpen = useUiStore((s) => s.setNavOpen)
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  const colorMode = useUiStore((s) => s.colorMode)
  const setColorMode = useUiStore((s) => s.setColorMode)
  const locale = useUiStore((s) => s.locale)
  const setLocale = useUiStore((s) => s.setLocale)
  const user = useCurrentUser()
  const compareCount = useScenarioStore((s) => s.compare.length)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const logout = useLogout()
  const [langAnchor, setLangAnchor] = useState<HTMLElement | null>(null)
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null)

  const nav: Array<{ to: string; label: string; icon: ReactNode; show: boolean }> = [
    { to: '/', label: t('nav.home'), icon: <HomeOutlinedIcon />, show: true },
    { to: '/estimate/new', label: t('nav.estimate'), icon: <CalculateOutlinedIcon />, show: true },
    { to: '/budget', label: t('nav.budget'), icon: <SavingsOutlinedIcon />, show: true },
    { to: '/reach', label: t('nav.reach'), icon: <TimelineOutlinedIcon />, show: true },
    { to: '/cost-to-complete', label: t('nav.complete'), icon: <ConstructionOutlinedIcon />, show: true },
    { to: '/projects', label: t('nav.projects'), icon: <FolderOutlinedIcon />, show: can(user, 'create_project') },
    { to: '/compare', label: t('nav.compare'), icon: <CompareArrowsIcon />, show: true },
    { to: '/admin', label: t('nav.admin'), icon: <AdminPanelSettingsOutlinedIcon />, show: can(user, 'admin_panel') },
    { to: '/settings', label: t('nav.settings'), icon: <SettingsOutlinedIcon />, show: true },
  ]

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 32, height: 32 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.1 }}>
            {t('app.name')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Rwanda · RWF
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {nav
          .filter((n) => n.show)
          .map((n) => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <ListItemButton key={n.to} component={Link} to={n.to} selected={active} onClick={() => !desktop && setNavOpen(false)} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {n.to === '/compare' ? (
                    <Badge badgeContent={compareCount} color="secondary">
                      {n.icon}
                    </Badge>
                  ) : (
                    n.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={n.label} />
              </ListItemButton>
            )
          })}
      </List>
      <Box sx={{ p: 2 }}>
        <InstallButton fullWidth />
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', zIndex: (th) => th.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          {!desktop && (
            <IconButton edge="start" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }}>
            {t('app.tagline')}
          </Typography>
          <Box sx={{ flex: { xs: 1, sm: 0 } }} />
          {can(user, 'professional_mode') && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={mode}
              onChange={(_, v: UiMode | null) => v && setMode(v)}
              aria-label={t('mode.label')}
            >
              <ToggleButton value="client">{t('mode.client')}</ToggleButton>
              <ToggleButton value="professional">{t('mode.professional')}</ToggleButton>
              {can(user, 'enterprise_mode') && <ToggleButton value="enterprise">{t('mode.enterprise')}</ToggleButton>}
            </ToggleButtonGroup>
          )}
          <Tooltip title="Language">
            <IconButton aria-label="Language" onClick={(e) => setLangAnchor(e.currentTarget)}>
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          <Menu open={Boolean(langAnchor)} anchorEl={langAnchor} onClose={() => setLangAnchor(null)}>
            {(['en', 'rw', 'fr'] as Locale[]).map((l) => (
              <MenuItem key={l} selected={l === locale} onClick={() => { setLocale(l); setLangAnchor(null) }}>
                {l === 'en' ? 'English' : l === 'rw' ? 'Kinyarwanda' : 'Français'}
              </MenuItem>
            ))}
          </Menu>
          <Tooltip title="Toggle theme">
            <IconButton aria-label="Toggle theme" onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}>
              {colorMode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
          {user ? (
            <>
              <IconButton aria-label="Account" onClick={(e) => setUserAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>{user.name.slice(0, 1)}</Avatar>
              </IconButton>
              <Menu open={Boolean(userAnchor)} anchorEl={userAnchor} onClose={() => setUserAnchor(null)}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2">{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ROLE_LABEL[user.role]}
                    {user.companyName ? ` · ${user.companyName}` : ''}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { setUserAnchor(null); void navigate({ to: '/settings' }) }}>{t('nav.settings')}</MenuItem>
                <MenuItem onClick={() => { setUserAnchor(null); logout.mutate() }}>{t('nav.logout')}</MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={Link} to="/login" variant="contained" size="small">
              {t('nav.login')}
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {desktop ? (
          <Drawer variant="permanent" open sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 1, borderColor: 'divider' } }}>
            {drawer}
          </Drawer>
        ) : (
          <Drawer variant="temporary" open={navOpen} onClose={() => setNavOpen(false)} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
            {drawer}
          </Drawer>
        )}
      </Box>
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        <OfflineBanner />
        <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, maxWidth: 1280, width: '100%', mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  )
}
