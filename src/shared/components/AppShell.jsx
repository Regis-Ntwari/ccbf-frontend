import { useState } from 'react'
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
import ListSubheader from '@mui/material/ListSubheader'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Badge from '@mui/material/Badge'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import LanguageIcon from '@mui/icons-material/Language'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useCurrentUser, useScenarioStore, useUiStore } from '@/shared/stores'

import { can, roleLabel } from '@/shared/lib/permissions'
import { LOCALE_LABEL } from '@/shared/i18n'
import { OfflineBanner } from '@/pwa/OfflineBanner'
import { InstallButton } from '@/pwa/InstallButton'
import { useLogout } from '@/features/auth/api'
import { Wordmark } from './Wordmark'
import { Breadcrumbs } from './Breadcrumbs'
import { FONT_MONO } from '@/shared/theme/theme'
import { useConfig } from '@/features/config/api'

const DRAWER_WIDTH = 240

/** Shell for signed-in users: structured sidebar, compact top bar with breadcrumbs. */
export function AppShell({ children }) {
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
  const [langAnchor, setLangAnchor] = useState(null)
  const [userAnchor, setUserAnchor] = useState(null)
  const pro = can(user, 'professional_mode')
  const config = useConfig()
  const locales = config.data?.localization.enabledLocales ?? ['en', 'rw', 'fr']

  const sections = [
    {
      title: '',
      items: [
        { to: '/overview', label: t('titles.overview'), icon: <GridViewOutlinedIcon />, show: true },
        { to: '/projects', label: t('nav.projects'), icon: <FolderOutlinedIcon />, show: can(user, 'create_project') },
      ],
    },
    {
      title: t('shell.nav.costEstimation'),
      items: [
        { to: '/estimate/new', label: t('nav.estimate'), icon: <CalculateOutlinedIcon />, show: true },
        { to: '/budget', label: t('nav.budget'), icon: <SavingsOutlinedIcon />, show: true },
        { to: '/reach', label: t('nav.reach'), icon: <TimelineOutlinedIcon />, show: true },
        { to: '/cost-to-complete', label: t('nav.complete'), icon: <ConstructionOutlinedIcon />, show: true },
        { to: '/compare', label: t('nav.compare'), icon: <CompareArrowsIcon />, show: true, badge: compareCount },
      ],
    },
    {
      title: t('shell.nav.professional'),
      items: [
        { to: '/boq', label: t('titles.boq'), icon: <ListAltOutlinedIcon />, show: pro },
        { to: '/materials', label: t('titles.materials'), icon: <Inventory2OutlinedIcon />, show: pro },
        { to: '/reports', label: t('titles.reports'), icon: <DescriptionOutlinedIcon />, show: true },
      ],
    },
    {
      title: t('shell.nav.administration'),
      items: [
        {
          to: '/admin',
          label: t('nav.admin'),
          icon: <AdminPanelSettingsOutlinedIcon />,
          show: can(user, 'admin_panel'),
        },
        {
          to: '/admin/settings',
          label: t('titles.platformConfig'),
          icon: <TuneOutlinedIcon />,
          show: can(user, 'edit_global_rules'),
        },
        { to: '/settings', label: t('nav.settings'), icon: <SettingsOutlinedIcon />, show: true },
      ],
    },
  ]

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'surface.secondary' }}>
      <Box sx={{ px: 2, height: 52, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Wordmark />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {sections.map((section) => {
          const items = section.items.filter((i) => i.show)
          if (!items.length) return null
          return (
            <List
              key={section.title || 'main'}
              dense
              sx={{ px: 1 }}
              subheader={
                section.title ? (
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: 'transparent',
                      fontFamily: FONT_MONO,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      lineHeight: '28px',
                      px: 1.5,
                    }}
                  >
                    {section.title}
                  </ListSubheader>
                ) : undefined
              }
            >
              {items.map((n) => {
                const active =
                  pathname === n.to ||
                  (n.to !== '/' &&
                    pathname.startsWith(n.to + '/') &&
                    !(n.to === '/admin' && pathname.startsWith('/admin/settings'))) ||
                  (n.to === '/estimate/new' && pathname.startsWith('/estimate'))
                return (
                  <ListItemButton
                    key={n.to}
                    component={Link}
                    to={n.to}
                    selected={active}
                    onClick={() => !desktop && setNavOpen(false)}
                    sx={{
                      py: 0.75,
                      pl: 1.5,
                      borderLeft: '2px solid',
                      borderColor: active ? 'secondary.main' : 'transparent',
                      borderRadius: 0,
                      '&.Mui-selected': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? 'text.primary' : 'text.secondary',
                        '& svg': { fontSize: 18 },
                      }}
                    >
                      {n.badge ? (
                        <Badge
                          badgeContent={n.badge}
                          color="secondary"
                          sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                        >
                          {n.icon}
                        </Badge>
                      ) : (
                        n.icon
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={n.label}
                      slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: active ? 600 : 500 } } }}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          )
        })}
      </Box>
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <InstallButton fullWidth />
        {user && (
          <Typography
            sx={{ fontFamily: FONT_MONO, fontSize: 10, color: 'text.secondary', mt: 1, letterSpacing: '0.04em' }}
          >
            {user.companyName ?? t('shell.nav.personalWorkspace')}
          </Typography>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      <Box component="nav" className="no-print" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {desktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                borderRight: 1,
                borderColor: 'divider',
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={navOpen}
            onClose={() => setNavOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          className="no-print"
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 52, gap: 1, px: { xs: 1.5, md: 3 } }}>
            {!desktop && (
              <IconButton
                edge="start"
                size="small"
                aria-label={t('shell.nav.openNav')}
                onClick={() => setNavOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <Breadcrumbs />
            </Box>
            {pro && (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={mode}
                onChange={(_, v) => v && setMode(v)}
                aria-label={t('mode.label')}
                sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.25, fontSize: 12 } }}
              >
                <ToggleButton value="client">{t('mode.client')}</ToggleButton>
                <ToggleButton value="professional">{t('mode.professional')}</ToggleButton>
                {can(user, 'enterprise_mode') && <ToggleButton value="enterprise">{t('mode.enterprise')}</ToggleButton>}
              </ToggleButtonGroup>
            )}
            <Tooltip title={t('shell.nav.language')}>
              <IconButton
                size="small"
                aria-label={t('shell.nav.language')}
                onClick={(e) => setLangAnchor(e.currentTarget)}
              >
                <LanguageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
            <Tooltip title={t('shell.nav.toggleTheme')}>
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
            </Tooltip>
            {user && (
              <>
                <IconButton
                  aria-label={t('shell.nav.account')}
                  onClick={(e) => setUserAnchor(e.currentTarget)}
                  sx={{ p: 0.5 }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 1,
                    }}
                  >
                    {user.name.slice(0, 1)}
                  </Avatar>
                </IconButton>
                <Menu open={Boolean(userAnchor)} anchorEl={userAnchor} onClose={() => setUserAnchor(null)}>
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {roleLabel(t, user.role)}
                      {user.companyName ? ` · ${user.companyName}` : ''}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setUserAnchor(null)
                      void navigate({ to: '/settings' })
                    }}
                  >
                    {t('nav.settings')}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setUserAnchor(null)
                      logout.mutate()
                    }}
                  >
                    {t('nav.logout')}
                  </MenuItem>
                </Menu>
              </>
            )}
          </Toolbar>
        </AppBar>
        <OfflineBanner />
        <Box sx={{ flex: 1, px: { xs: 2, md: 4, xl: 6 }, py: { xs: 2, md: 3 }, width: '100%' }}>{children}</Box>
      </Box>
    </Box>
  )
}
