import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import { PageHeader } from '@/shared/components/PageHeader'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { QualityChip } from '@/shared/components/QualityChip'
import { Money } from '@/shared/components/Money'
import { ErrorState, LoadingState } from '@/shared/components/States'
import { ReverseBudgetRequestSchema, TypologySchema } from '@/shared/api/schemas'

import { estimateApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'
import { formatMoney, formatRange } from '@/shared/lib/format'
import { useLocations, useReverseBudget } from '@/features/estimate/api'

/** J2: enter budget → 2–4 diverse options, each re-validated by the forward engine. */
export function ReverseBudgetPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const locations = useLocations()
  const [form, setForm] = useState({ budget: '60000000', locationId: 'kigali', typology: 'house', ownsLand: true })
  const [req, setReq] = useState(null)
  const [error, setError] = useState(null)
  const [picking, setPicking] = useState(null)
  const result = useReverseBudget(req)

  const submit = () => {
    const parsed = ReverseBudgetRequestSchema.safeParse({ ...form, budget: Number(form.budget) })
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t('estimate.budget.checkInputs'))
    setError(null)
    setReq(parsed.data)
  }

  const pick = async (o) => {
    setPicking(o.id)
    const est = await estimateApi.run(o.params)
    qc.setQueryData(qk.estimate(est.id), est)
    void navigate({ to: '/estimate/$estimateId', params: { estimateId: est.id } })
  }

  return (
    <Box>
      <PageHeader title={t('nav.budget')} subtitle={t('estimate.budget.subtitle')} />
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('estimate.budget.yourBudget')}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">RWF</InputAdornment> },
                  htmlInput: { min: 1000000, step: 1000000 },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                label={t('common.location')}
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              >
                {(locations.data ?? []).map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                label={t('estimate.labels.type')}
                value={form.typology}
                onChange={(e) => setForm({ ...form, typology: e.target.value })}
              >
                {TypologySchema.options.map((ty) => (
                  <MenuItem key={ty} value={ty}>
                    {t(`typology.${ty}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch checked={form.ownsLand} onChange={(e) => setForm({ ...form, ownsLand: e.target.checked })} />
                }
                label={t('estimate.budget.ownLand')}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 1 }}>
              <Button fullWidth variant="contained" onClick={submit} disabled={result.isFetching}>
                {t('estimate.budget.go')}
              </Button>
            </Grid>
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {result.isPending && req && <LoadingState label={t('estimate.budget.solving')} />}
      {result.isError && <ErrorState error={result.error} onRetry={() => void result.refetch()} />}
      {result.data && (
        <>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="h4" component="h2">
              {t('estimate.budget.optionsFor', {
                budget: formatMoney(result.data.budget, 'RWF', i18n.language, { compact: true }),
              })}
            </Typography>
            <EstimateClassBadge estimateClass={1} />
          </Stack>
          <Grid container spacing={2}>
            {result.data.options.map((o) => (
              <Grid key={o.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h5">{o.title}</Typography>
                      <QualityChip quality={o.params.quality} />
                    </Stack>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                      {o.description}
                    </Typography>
                    <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      <Chip size="small" label={`${o.params.gfa} m²`} />
                      <Chip size="small" label={t('estimate.budget.beds', { n: o.params.bedrooms })} />
                      <Chip
                        size="small"
                        label={t(o.params.storeys === 1 ? 'estimate.floors_one' : 'estimate.floors_other', {
                          n: o.params.storeys,
                        })}
                      />
                    </Stack>
                    <Typography variant="overline" color="text.secondary">
                      {t('result.range')}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {formatRange(o.total, 'RWF', i18n.language)}
                    </Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="caption">{t('estimate.budget.covers')}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {o.completionPct} %
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={o.completionPct}
                        color={o.completionPct >= 100 ? 'success' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {t('estimate.budget.revalidated', {
                          pct: `${o.budgetDeviationPct > 0 ? '+' : ''}${o.budgetDeviationPct}`,
                        })}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button fullWidth variant="contained" onClick={() => void pick(o)} disabled={picking === o.id}>
                      {t('estimate.budget.choose')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            <Money value={0} sx={{ display: 'none' }} />
            {t('estimate.budget.footnote')}
          </Typography>
        </>
      )}
    </Box>
  )
}
