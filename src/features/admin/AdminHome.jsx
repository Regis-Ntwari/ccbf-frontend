import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { PageHeader } from '@/shared/components/PageHeader'
import { usePrices } from '@/features/catalogue/api'
import { useCurrentUser } from '@/shared/stores'
import { can } from '@/shared/lib/permissions'

export function AdminHome() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const pending = usePrices({ status: 'pending' })
  const flagged = usePrices({ status: 'flagged' })
  const cards = [
    {
      to: '/admin/submissions',
      title: t('admin.home.submissions.title'),
      text: t('admin.home.submissions.text'),
      badge: (pending.data?.length ?? 0) + (flagged.data?.length ?? 0),
      show: can(user, 'approve_global_prices'),
    },
    {
      to: '/materials',
      title: t('admin.home.materials.title'),
      text: t('admin.home.materials.text'),
      badge: null,
      show: true,
    },
    {
      to: '/admin/settings',
      title: t('admin.home.settings.title'),
      text: t('admin.home.settings.text'),
      badge: null,
      show: can(user, 'edit_global_rules'),
    },
  ]
  return (
    <Box>
      <PageHeader title={t('admin.home.title')} subtitle={t('admin.home.subtitle')} />
      <Grid container spacing={2}>
        {cards
          .filter((c) => c.show)
          .map((c) => (
            <Grid key={c.to} size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardActionArea component={Link} to={c.to}>
                  <CardContent>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {c.title}
                      {c.badge ? <Chip size="small" color="secondary" label={c.badge} /> : null}
                    </Typography>
                    <Typography color="text.secondary">{c.text}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  )
}
