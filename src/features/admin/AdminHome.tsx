import { Link } from '@tanstack/react-router'
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
  const user = useCurrentUser()
  const pending = usePrices({ status: 'pending' })
  const flagged = usePrices({ status: 'flagged' })
  const cards = [
    { to: '/admin/submissions', title: 'Price submissions', text: 'Verify, approve or reject submitted prices. Anomalies are flagged automatically.', badge: (pending.data?.length ?? 0) + (flagged.data?.length ?? 0), show: can(user, 'approve_global_prices') },
    { to: '/admin/prices', title: 'Price database', text: 'Materials, labour and plant with source, date, confidence and verification status.', badge: null, show: true },
  ]
  return (
    <Box>
      <PageHeader title="Admin" subtitle="Data quality is the product. Keep the catalogue current and every number traceable." />
      <Grid container spacing={2}>
        {cards.filter((c) => c.show).map((c) => (
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
