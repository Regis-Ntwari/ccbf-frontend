import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import LinearProgress from '@mui/material/LinearProgress'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import TuneIcon from '@mui/icons-material/Tune'
import type { EstimateParams, EstimateResult, FeatureFlag, QualityLevel } from '@/shared/api/schemas'
import { FEATURE_FLAGS, QUALITY_LEVELS } from '@/shared/api/schemas'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { RangeHero, Money } from '@/shared/components/Money'
import { TraceButton } from '@/shared/components/TraceButton'
import { PhaseChart } from '@/shared/components/charts/PhaseChart'
import { SCurveChart } from '@/shared/components/charts/SCurveChart'
import { AssumptionsPanel, WarningsList } from '@/shared/components/AssumptionsPanel'
import { QualityChip } from '@/shared/components/QualityChip'
import { useCurrentUser, useScenarioStore, useUiStore, useWizardStore } from '@/shared/stores'
import { formatArea, formatMoney } from '@/shared/lib/format'
import { can } from '@/shared/lib/permissions'
import { useRunEstimate } from './api'
import { FEATURE_LABEL } from './wizard/steps'
import { SaveProjectDialog } from '@/features/projects/SaveProjectDialog'

interface Props {
  estimate: EstimateResult
  /** When set, what-ifs stay on the project page instead of navigating to /estimate/$id. */
  projectId?: string
  onParamsChange?: (params: EstimateParams) => void
}

/**
 * The result page (J1 step 3): range, cost/m², phase chart, 4 quality options,
 * "what changes" sliders. Professional mode adds element costs and the fee split.
 */
export function ResultView({ estimate, projectId, onParamsChange }: Props) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const mode = useUiStore((s) => s.mode)
  const user = useCurrentUser()
  const addCompare = useScenarioStore((s) => s.add)
  const loadParams = useWizardStore((s) => s.loadParams)
  const [whatIf, setWhatIf] = useState<EstimateParams>(estimate.params)
  const [baseline, setBaseline] = useState(estimate.params)
  const [saveOpen, setSaveOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Reset the what-if panel when a different estimate is shown (React "adjust state on prop change").
  if (baseline !== estimate.params) {
    setBaseline(estimate.params)
    setWhatIf(estimate.params)
  }

  // Debounced what-if: rerun the engine on slider release / toggles.
  const dirty = useMemo(() => JSON.stringify(whatIf) !== JSON.stringify(estimate.params), [whatIf, estimate.params])
  const preview = useRunEstimate(dirty ? whatIf : null, projectId)

  // Standalone page: navigate once the preview estimate is known (its id is deterministic from params).
  useEffect(() => {
    if (!dirty || !preview.data || preview.data.id === estimate.id) return
    if (onParamsChange) return
    void navigate({ to: '/estimate/$estimateId', params: { estimateId: preview.data.id }, replace: true })
  }, [preview.data, dirty, estimate.id, navigate, onParamsChange])

  const professional = mode !== 'client' && can(user, 'view_rates')
  const shown = preview.data && dirty ? preview.data : estimate
  const pct = (n: number) => `${((n / shown.total.mid) * 100).toFixed(0)} %`

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <EstimateClassBadge estimateClass={shown.estimateClass} />
          <Chip size="small" label={t(`typology.${shown.params.typology}`)} />
          <Chip size="small" label={formatArea(shown.params.gfa, i18n.language)} />
          <Chip size="small" label={`${shown.params.storeys} floor${shown.params.storeys > 1 ? 's' : ''}`} />
          <QualityChip quality={shown.params.quality} />
        </Stack>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<CompareArrowsIcon />} onClick={() => { addCompare({ estimateId: shown.id, label: `${t(`typology.${shown.params.typology}`)} ${shown.params.gfa} m² ${shown.params.quality}`, params: shown.params, totalMid: shown.total.mid }); setToast('Added to compare') }}>
            {t('nav.compare')}
          </Button>
          <Button size="small" startIcon={<ShareOutlinedIcon />} onClick={() => { void navigator.clipboard?.writeText(window.location.href); setToast('Link copied') }}>
            {t('result.share')}
          </Button>
          {!projectId && (
            <Button size="small" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => (user ? setSaveOpen(true) : void navigate({ to: '/login', search: { redirect: window.location.pathname } }))}>
              {t('result.save')}
            </Button>
          )}
          {!projectId && shown.estimateClass === 1 && (
            <Button size="small" variant="outlined" startIcon={<TuneIcon />} onClick={() => { loadParams({ ...shown.params, requestedClass: 2 }); void navigate({ to: '/estimate/new', search: { step: 'rooms' } }) }}>
              {t('result.refine')}
            </Button>
          )}
        </Stack>
      </Stack>

      {preview.isFetching && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <RangeHero range={shown.total} label={t('result.range')} estimateId={shown.id} figureId={shown.totalFigureId} />
              <Stack direction="row" sx={{ gap: 3, mt: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">{t('result.perM2')}</Typography>
                  <Typography variant="h5"><Money value={shown.costPerM2} /></Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">{t('result.duration')}</Typography>
                  <Typography variant="h5">{shown.durationMonths} {t('common.months')}</Typography>
                </Box>
                {professional && (
                  <>
                    <Box>
                      <Typography variant="overline" color="text.secondary">Construction</Typography>
                      <Typography variant="h5"><Money value={shown.constructionCost.mid} compact /></Typography>
                    </Box>
                    <Box>
                      <Typography variant="overline" color="text.secondary">Contingency</Typography>
                      <Typography variant="h5"><Money value={shown.contingency} compact /></Typography>
                    </Box>
                    <Box>
                      <Typography variant="overline" color="text.secondary">Fees & taxes</Typography>
                      <Typography variant="h5"><Money value={shown.feesAndTaxes} compact /></Typography>
                    </Box>
                  </>
                )}
              </Stack>
              <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                {t('result.disclaimer', { label: shown.classLabel.toLowerCase() })}
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>{t('result.whatChanges')}</Typography>
              <Typography variant="body2" color="text.secondary">Area: {whatIf.gfa} m²</Typography>
              <Slider value={whatIf.gfa} min={40} max={Math.max(600, estimate.params.gfa * 2)} step={5} valueLabelDisplay="auto" onChange={(_, v) => setWhatIf({ ...whatIf, gfa: v as number })} aria-label="Area" />
              <Typography variant="body2" color="text.secondary">Floors: {whatIf.storeys}</Typography>
              <Slider value={whatIf.storeys} min={1} max={6} step={1} marks valueLabelDisplay="auto" onChange={(_, v) => setWhatIf({ ...whatIf, storeys: v as number })} aria-label="Floors" />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Finish</Typography>
              <ToggleButtonGroup size="small" exclusive fullWidth value={whatIf.quality} onChange={(_, v: QualityLevel | null) => v && setWhatIf({ ...whatIf, quality: v, elementOverrides: {} })}>
                {QUALITY_LEVELS.map((q) => (
                  <ToggleButton key={q} value={q}>{t(`quality.${q}`)}</ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 0.5 }}>Extras</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {FEATURE_FLAGS.map((f: FeatureFlag) => {
                  const on = whatIf.features.includes(f)
                  return <Chip key={f} size="small" label={FEATURE_LABEL[f]} color={on ? 'primary' : 'default'} variant={on ? 'filled' : 'outlined'} onClick={() => setWhatIf({ ...whatIf, features: on ? whatIf.features.filter((x) => x !== f) : [...whatIf.features, f] })} />
                })}
              </Stack>
              {dirty && onParamsChange && (
                <Button sx={{ mt: 2 }} variant="contained" size="small" onClick={() => onParamsChange(whatIf)}>
                  Apply to project
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>{t('result.phases')}</Typography>
              <PhaseChart phases={shown.phases} />
              <Box sx={{ overflowX: 'auto', mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Phase</TableCell>
                      <TableCell align="right">Share</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Cost</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>Cumulative</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shown.phases.filter((p) => p.amount > 0).map((p) => (
                      <TableRow key={p.code}>
                        <TableCell>{p.code} {p.name} <TraceButton estimateId={shown.id} figureId={p.figureId} /></TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{p.pct} %</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}><Money value={p.amount} compact /></TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}><Money value={p.cumulative} compact /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>{t('result.options')}</Typography>
              <Stack spacing={1}>
                {shown.qualityOptions.map((o) => {
                  const active = o.quality === shown.params.quality && Object.keys(shown.params.elementOverrides).length === 0
                  return (
                    <Card key={o.quality} variant="outlined" sx={{ borderColor: active ? 'primary.main' : 'divider' }}>
                      <CardActionArea onClick={() => setWhatIf({ ...whatIf, quality: o.quality, elementOverrides: {} })} sx={{ p: 1.5 }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <QualityChip quality={o.quality} />
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                              {formatMoney(o.total.low, 'RWF', i18n.language, { compact: true })} – {formatMoney(o.total.high, 'RWF', i18n.language, { compact: true })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary"><Money value={o.costPerM2} /> {t('result.perM2')}</Typography>
                          </Box>
                        </Stack>
                      </CardActionArea>
                    </Card>
                  )
                })}
              </Stack>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>{t('result.cashflow')}</Typography>
              <SCurveChart points={shown.cashFlow} height={220} />
            </CardContent>
          </Card>
        </Grid>

        {professional && (
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom>Elemental breakdown</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Element</TableCell>
                      <TableCell>Quality</TableCell>
                      <TableCell>Package</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">% of total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...shown.elements].sort((a, b) => b.amount - a.amount).map((e) => (
                      <TableRow key={e.group}>
                        <TableCell>{e.name} <TraceButton estimateId={shown.id} figureId={e.figureId} /></TableCell>
                        <TableCell><QualityChip quality={e.quality} /></TableCell>
                        <TableCell>{e.packageCode}</TableCell>
                        <TableCell align="right"><Money value={e.amount} /></TableCell>
                        <TableCell align="right">{pct(e.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Engine {shown.engineVersion} · rules {shown.rulesVersion} · price snapshot {shown.priceSnapshotId}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Stack spacing={2}>
            <WarningsList warnings={shown.warnings} />
            <AssumptionsPanel assumptions={shown.assumptions} title={t('result.assumptions')} />
          </Stack>
        </Grid>
      </Grid>

      <SaveProjectDialog open={saveOpen} onClose={() => setSaveOpen(false)} params={shown.params} estimateId={shown.id} />
      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast(null)} message={toast} />
    </Box>
  )
}
