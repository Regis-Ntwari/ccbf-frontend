import { useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { FONT_MONO } from '@/shared/theme/theme'
import { pageTitle } from '@/shared/lib/head'

const SUGGESTIONS = [
  { to: '/', label: 'shell.notFound.startEstimate' },
  { to: '/budget', label: 'nav.budget' },
  { to: '/reach', label: 'nav.reach' },
  { to: '/cost-to-complete', label: 'nav.complete' },
]

/** 404 for unknown paths. Rendered inside whichever shell the visitor is in. */
export function NotFound() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const pathname = router.state.location.pathname
  useEffect(() => {
    document.title = pageTitle(t('titles.notFound'), queryClient)
  }, [queryClient, t])
  return (
    <Box sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {t('shell.notFound.eyebrow')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' },
          gap: { xs: 2, md: 6 },
          alignItems: 'start',
          pb: 4,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          component="p"
          sx={{
            fontFamily: FONT_MONO,
            fontSize: { xs: 72, md: 112 },
            fontWeight: 500,
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: 'secondary.main',
          }}
        >
          404
        </Typography>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1" component="h1" sx={{ mb: 1.5 }}>
            {t('shell.notFound.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            {t('shell.notFound.body')}
          </Typography>
          <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, color: 'text.disabled', wordBreak: 'break-all' }}>
            {pathname}
          </Typography>
          <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
            <Button component={Link} to="/" variant="contained">
              {t('shell.notFound.backHome')}
            </Button>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.history.back()}>
              {t('shell.notFound.goBack')}
            </Button>
          </Stack>
        </Box>
      </Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 3, mb: 1 }}>
        {t('shell.notFound.orTry')}
      </Typography>
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: '1px',
          bgcolor: 'divider',
          border: 1,
          borderColor: 'divider',
        }}
      >
        {SUGGESTIONS.map((s, i) => (
          <Box
            component="li"
            key={s.to}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Box
              component={Link}
              to={s.to}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, textDecoration: 'none', color: 'inherit' }}
            >
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: 'text.secondary', width: 22 }}>
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>{t(s.label)}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
