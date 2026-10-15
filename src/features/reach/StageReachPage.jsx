import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { PageHeader } from '@/shared/components/PageHeader'
import { Money } from '@/shared/components/Money'
import { ErrorState, LoadingState } from '@/shared/components/States'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { CHART } from '@/shared/theme/theme'

import { EstimateParamsSchema } from '@/shared/api/schemas'
import { DEFAULT_PARAMS, ParamsQuickForm } from '@/features/estimate/ParamsQuickForm'
import { useStageReach } from '@/features/estimate/api'
import { formatMoney } from '@/shared/lib/format'

/** J3: land owned + budget → stage bar with ✓ / partial / unfunded and the cost of the next 25 %. */
export function StageReachPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useState({
    ...DEFAULT_PARAMS,
    site: { ownsLand: true, plotSizeM2: null, sloping: 'unknown' },
  })
  const [budget, setBudget] = useState('35000000')
  const [req, setReq] = useState(null)
  const [errors, setErrors] = useState({})
  const reach = useStageReach(req)

  const submit = () => {
    const p = EstimateParamsSchema.safeParse(params)
    if (!p.success) {
      const errs = {}
      for (const i of p.error.issues) errs[i.path.join('.')] = i.message
      return setErrors(errs)
    }
    setErrors({})
    setReq({ params: p.data, budget: Number(budget) })
  }

  const icon = (status) =>
    status === 'complete' ? (
      <CheckCircleIcon sx={{ color: CHART.status.good }} />
    ) : status === 'partial' ? (
      <PendingIcon sx={{ color: CHART.status.warning }} />
    ) : (
      <RadioButtonUncheckedIcon color="disabled" />
    )

  return (
    <Box>
      <PageHeader title={t('nav.reach')} subtitle={t('estimate.reach.subtitle')} />
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <ParamsQuickForm value={params} onChange={(patch) => setParams({ ...params, ...patch })} errors={errors} />
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, mt: 2, alignItems: { sm: 'center' } }}>
            <TextField
              type="number"
              label={t('estimate.reach.moneyNow')}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">RWF</InputAdornment> } }}
              sx={{ minWidth: 260 }}
            />
            <Button variant="contained" onClick={submit} disabled={reach.isFetching}>
              {t('estimate.reach.show')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {reach.isPending && req && <LoadingState />}
      {reach.isError && <ErrorState error={reach.error} onRetry={() => void reach.refetch()} />}
      {reach.data && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}
                >
                  <Typography variant="h5">{t('estimate.reach.reaches', { pct: reach.data.overallPct })}</Typography>
                  <EstimateClassBadge estimateClass={1} />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={reach.data.overallPct}
                  sx={{ height: 12, borderRadius: 6, mb: 3 }}
                />
                <Stack spacing={1}>
                  {reach.data.stages
                    .filter((s) => s.cost > 0)
                    .map((s) => (
                      <Stack key={s.code} direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                        <Tooltip title={t(`estimate.reach.status.${s.status}`)}>{icon(s.status)}</Tooltip>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                            <Typography noWrap>
                              {s.code} {s.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                              {s.status === 'partial' ? `${s.fundedPct} % · ` : ''}
                              <Money value={s.cost} compact />
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={s.fundedPct}
                            color={s.status === 'complete' ? 'success' : s.status === 'partial' ? 'warning' : 'inherit'}
                            sx={{ height: 6, borderRadius: 3, mt: 0.5, opacity: s.status === 'unfunded' ? 0.4 : 1 }}
                          />
                        </Box>
                      </Stack>
                    ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    {t('estimate.reach.next25')}
                  </Typography>
                  <Typography variant="h3">
                    <Money value={reach.data.nextQuarterCost} compact />
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    {t('estimate.reach.stillNeeded')}
                  </Typography>
                  <Typography variant="h3">
                    <Money value={reach.data.shortfallToComplete} compact />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('estimate.reach.budgetNote', {
                      budget: formatMoney(reach.data.budget, 'RWF', i18n.language, { compact: true }),
                    })}
                  </Typography>
                </CardContent>
              </Card>
              <Alert severity="info" variant="outlined">
                {t('estimate.reach.stagesNote')}
              </Alert>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
