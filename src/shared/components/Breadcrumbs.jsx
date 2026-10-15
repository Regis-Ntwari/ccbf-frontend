import { Link, useMatches } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'

/**
 * Breadcrumbs derived from the matched route tree. `staticData.crumb` is a
 * translation key (`'titles.projects'`); `loaderData.name` is already localised data.
 */
export function Breadcrumbs() {
  const { t } = useTranslation()
  const matches = useMatches()
  const crumbs = matches
    .map((m) => {
      const data = m.loaderData
      const crumb = m.staticData.crumb
      const label = crumb ? t(crumb) : typeof data?.name === 'string' ? data.name : null
      return label ? { id: m.id, label, to: m.pathname } : null
    })
    .filter((c) => Boolean(c))
  if (crumbs.length <= 1) {
    return (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {crumbs[0]?.label ?? ''}
      </Typography>
    )
  }
  return (
    <MuiBreadcrumbs
      separator="/"
      sx={{ fontSize: 13, '& .MuiBreadcrumbs-separator': { color: 'text.disabled', mx: 1 } }}
      aria-label={t('shell.nav.breadcrumb')}
    >
      {crumbs.map((c, i) =>
        i < crumbs.length - 1 ? (
          <MuiLink key={c.id} component={Link} to={c.to} underline="hover" color="text.secondary">
            {c.label}
          </MuiLink>
        ) : (
          <Typography key={c.id} variant="body2" sx={{ fontWeight: 500 }}>
            {c.label}
          </Typography>
        ),
      )}
    </MuiBreadcrumbs>
  )
}
