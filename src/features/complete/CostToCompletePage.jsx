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
import Slider from '@mui/material/Slider'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import { PageHeader } from '@/shared/components/PageHeader'
import { Money, RangeHero } from '@/shared/components/Money'
import { ErrorState, LoadingState } from '@/shared/components/States'

import { EstimateParamsSchema, PHASE_CODES } from '@/shared/api/schemas'
import { DEFAULT_PARAMS, ParamsQuickForm } from '@/features/estimate/ParamsQuickForm'
import { useCostToComplete } from '@/features/estimate/api'
import { useConfig } from '@/features/config/api'

/** J4: completed phases + % per phase + amount spent → remaining, shortfall, forecast. */
export function CostToCompletePage() {
  const { t } = useTranslation()
  const config = useConfig()
  const phaseName = (code) => config.data?.phaseNames?.[code] ?? code
  const [params, setParams] = useState({ ...DEFAULT_PARAMS, budget: 90_000_000 })
  const [progress, setProgress] = useState({ P0: 100, P1: 100, P2: 100, P3: 60 })
  const [spent, setSpent] = useState('32000000')
  const [req, setReq] = useState(null)
  const [errors, setErrors] = useState({})
  const ctc = useCostToComplete(req)

  const submit = () => {
    const p = EstimateParamsSchema.safeParse(params)
    if (!p.success) {
      const errs = {}
      for (const i of p.error.issues) errs[i.path.join('.')] = i.message
      return setErrors(errs)
    }
    setErrors({})
    setReq({ params: p.data, phaseProgress: progress, amountSpent: Number(spent) || 0 })
  }

  return (
    <Box>
      <PageHeader title={t('nav.complete')} subtitle={t('estimate.complete.subtitle')} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <ParamsQuickForm
                value={params}
                onChange={(patch) => setParams({ ...params, ...patch })}
                errors={errors}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, mt: 2 }}>
                <TextField
                  type="number"
                  label={t('estimate.complete.spent')}
                  value={spent}
                  onChange={(e) => setSpent(e.target.value)}
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">RWF</InputAdornment> } }}
                  fullWidth
                />
                <TextField
                  type="number"
                  label={t('estimate.complete.totalBudget')}
                  value={params.budget ?? ''}
                  onChange={(e) =>
                    setParams({ ...params, budget: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">RWF</InputAdornment> } }}
                  fullWidth
                />
              </Stack>
              <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
                {t('estimate.complete.progressPerPhase')}
              </Typography>
              {PHASE_CODES.map((code) => (
                <Stack key={code} direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ width: 220 }} noWrap>
                    {code} {phaseName(code)}
                  </Typography>
                  <Slider
                    value={progress[code] ?? 0}
                    step={5}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${v} %`}
                    onChange={(_, v) => setProgress({ ...progress, [code]: v })}
                    aria-label={t('estimate.complete.progressAria', { phase: phaseName(code) })}
                    sx={{ flex: 1 }}
                  />
                  <Typography sx={{ width: 48, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {progress[code] ?? 0} %
                  </Typography>
                </Stack>
              ))}
              <Button variant="contained" sx={{ mt: 2 }} onClick={submit} disabled={ctc.isFetching}>
                {t('estimate.complete.calculate')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          {ctc.isPending && req && <LoadingState />}
          {ctc.isError && <ErrorState error={ctc.error} onRetry={() => void ctc.refetch()} />}
          {ctc.data && (
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <RangeHero range={ctc.data.remainingCost} label={t('estimate.complete.remaining')} />
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <RangeHero range={ctc.data.forecastTotal} label={t('estimate.complete.forecast')} showMid={false} />
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ pl: 0 }}>{t('estimate.complete.valueDone')}</TableCell>
                        <TableCell align="right" sx={{ pr: 0 }}>
                          <Money value={ctc.data.valueOfWorkDone} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 0 }}>{t('estimate.complete.amountSpent')}</TableCell>
                        <TableCell align="right" sx={{ pr: 0 }}>
                          <Money value={ctc.data.amountSpent} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 0 }}>{t('estimate.complete.variance')}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ pr: 0, color: ctc.data.varianceToDate > 0 ? 'error.main' : 'success.main' }}
                        >
                          <Money value={ctc.data.varianceToDate} />
                        </TableCell>
                      </TableRow>
                      {ctc.data.shortfall != null && (
                        <TableRow>
                          <TableCell sx={{ pl: 0, fontWeight: 700 }}>{t('estimate.complete.shortfall')}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              pr: 0,
                              fontWeight: 700,
                              color: ctc.data.shortfall > 0 ? 'error.main' : 'success.main',
                            }}
                          >
                            <Money value={ctc.data.shortfall} />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {ctc.data.varianceToDate > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }} variant="outlined">
                      {t('estimate.complete.overspent')}
                    </Alert>
                  )}
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {t('estimate.complete.remainingByPhase')}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('estimate.resultView.table.phase')}</TableCell>
                        <TableCell align="right">{t('estimate.complete.done')}</TableCell>
                        <TableCell align="right">{t('estimate.complete.remainingCol')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ctc.data.phases
                        .filter((p) => p.budget > 0)
                        .map((p) => (
                          <TableRow key={p.code}>
                            <TableCell>
                              {p.code} {p.name}
                            </TableCell>
                            <TableCell align="right">{p.progressPct} %</TableCell>
                            <TableCell align="right">
                              <Money value={p.remaining} compact />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
