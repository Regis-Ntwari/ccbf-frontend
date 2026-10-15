import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Chip from '@mui/material/Chip'
import Fade from '@mui/material/Fade'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CheckIcon from '@mui/icons-material/Check'

import { EstimateParamsSchema, QUALITY_LEVELS } from '@/shared/api/schemas'
import { estimateApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'
import { useCurrentUser, useWizardStore } from '@/shared/stores'
import { useParseIntent } from '@/features/estimate/api'
import { SaveProjectDialog } from '@/features/projects/SaveProjectDialog'
import { RangeHero, Money } from '@/shared/components/Money'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { QualityChip } from '@/shared/components/QualityChip'
import { FONT_MONO } from '@/shared/theme/theme'
import { formatMoney } from '@/shared/lib/format'

const STEP_KEYS = ['building', 'site', 'finish', 'budget']

function toParams(d) {
  const r = EstimateParamsSchema.safeParse({
    typology: d.typology,
    locationId: d.locationId,
    gfa: d.gfa,
    storeys: d.storeys,
    bedrooms: d.bedrooms,
    bathrooms: Math.max(1, Math.round(d.bedrooms / 2)),
    quality: d.quality,
    features: d.features,
    requestedClass: 1,
  })
  return r.success ? r.data : null
}

const Choice = ({ on, onClick, children, ariaLabel }) => (
  <Box
    component="button"
    type="button"
    aria-pressed={on}
    aria-label={ariaLabel}
    onClick={onClick}
    sx={{
      font: 'inherit',
      textAlign: 'left',
      cursor: 'pointer',
      p: 1.75,
      border: '1px solid',
      borderColor: on ? 'text.primary' : 'divider',
      bgcolor: on ? 'action.selected' : 'background.paper',
      color: 'text.primary',
      position: 'relative',
      '&:hover': { borderColor: 'text.primary' },
    }}
  >
    {on && <CheckIcon sx={{ position: 'absolute', top: 8, right: 8, fontSize: 16 }} />}
    {children}
  </Box>
)

/** Public four-step estimator driven by platform configuration. Saving requires sign-in. */
export function HomeEstimator({ config }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useCurrentUser()
  const parse = useParseIntent()
  const loadParams = useWizardStore((s) => s.loadParams)
  const typologies = config.typologies.filter((x) => x.enabled)
  const extras = config.features.filter((f) => f.enabled)
  const defaultLocation = config.locations[0]?.id ?? 'kigali'
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState({
    typology: null,
    locationId: defaultLocation,
    gfa: 150,
    storeys: 1,
    bedrooms: 3,
    quality: 'STD',
    features: [],
  })
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const patch = (p) => setDraft((d) => ({ ...d, ...p }))
  const qualityLabel = (q) => config.qualities.find((x) => x.id === q)?.label ?? t(`quality.${q}`)

  const describe = async () => {
    if (!text.trim()) return
    const res = await parse.mutateAsync(text)
    const e = res.extracted
    patch({
      ...(e.typology ? { typology: e.typology } : {}),
      ...(e.locationId ? { locationId: e.locationId } : {}),
      ...(e.gfa ? { gfa: e.gfa } : {}),
      ...(e.storeys ? { storeys: e.storeys } : {}),
      ...(e.bedrooms ? { bedrooms: e.bedrooms } : {}),
      ...(e.quality ? { quality: e.quality } : {}),
      ...(e.features ? { features: e.features.filter((f) => extras.some((x) => x.id === f)) } : {}),
    })
    setStep(e.typology ? 1 : 0)
  }

  const run = async () => {
    const params = toParams(draft)
    if (!params) return setError(t('estimate.estimator.invalid'))
    setError(null)
    setRunning(true)
    try {
      const r = await estimateApi.run(params)
      qc.setQueryData(qk.estimate(r.id), r)
      setResult(r)
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }
  const next = () => {
    if (step === 0 && !draft.typology) return setError(t('estimate.estimator.noTypology'))
    setError(null)
    if (step === 2) return void run()
    setStep((s) => Math.min(3, s + 1))
  }
  const save = () => {
    if (!result) return
    if (user) return setSaveOpen(true)
    void navigate({ to: '/login', search: { redirect: `/estimate/${result.id}?save=true` } })
  }

  const summary = [
    [
      t('estimate.labels.type'),
      draft.typology ? (typologies.find((x) => x.id === draft.typology)?.label ?? draft.typology) : '—',
    ],
    [t('common.location'), config.locations.find((l) => l.id === draft.locationId)?.name ?? draft.locationId],
    [t('estimate.labels.floorArea'), `${draft.gfa} m²`],
    [t('estimate.labels.floors'), String(draft.storeys)],
    [t('estimate.labels.finish'), qualityLabel(draft.quality)],
    [
      t('wizard.extras'),
      draft.features.length
        ? draft.features.map((f) => extras.find((x) => x.id === f)?.label ?? f).join(', ')
        : t('estimate.labels.none'),
    ],
  ]

  return (
    <Box id="estimator" sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      {/* Horizontal step bar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'surface.secondary',
        }}
      >
        {STEP_KEYS.map((key, i) => {
          const label = t(`estimate.estimator.steps.${key}`)
          const state = i < step ? 'done' : i === step ? 'active' : 'todo'
          return (
            <Box
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => i < step && setStep(i)}
              onKeyDown={(e) => e.key === 'Enter' && i < step && setStep(i)}
              sx={{
                display: 'flex',
                gap: 1.25,
                alignItems: 'center',
                px: { xs: 1.5, md: 2.5 },
                py: 1.5,
                borderRight: i < 3 ? 1 : 0,
                borderBottom: '2px solid',
                borderColor: 'divider',
                borderBottomColor: state === 'active' ? 'secondary.main' : 'transparent',
                cursor: i < step ? 'pointer' : 'default',
                opacity: state === 'todo' ? 0.55 : 1,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  lineHeight: '22px',
                  width: 26,
                  height: 22,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: state === 'active' ? 'secondary.main' : 'text.primary',
                  bgcolor: state === 'done' ? 'text.primary' : state === 'active' ? 'secondary.main' : 'transparent',
                  color: state === 'todo' ? 'text.primary' : 'background.paper',
                  flexShrink: 0,
                }}
              >
                {state === 'done' ? '✓' : String(i + 1).padStart(2, '0')}
              </Box>
              <Typography
                noWrap
                sx={{
                  fontSize: 13.5,
                  fontWeight: state === 'active' ? 600 : 500,
                  display: { xs: i === step ? 'block' : 'none', sm: 'block' },
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' }, '& > *': { minWidth: 0 } }}>
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: 420, position: 'relative' }}>
          {running && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
          <Fade in key={step} timeout={300}>
            <Box>
              {step === 0 && (
                <>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    {t('landing.title')}
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ mb: 3, maxWidth: 760 }}
                    component="form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void describe()
                    }}
                  >
                    <TextField
                      fullWidth
                      placeholder={t('landing.placeholder')}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <AutoAwesomeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                        },
                        htmlInput: { 'aria-label': t('estimate.estimator.describeAria') },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="outlined"
                      disabled={parse.isPending || !text.trim()}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {t('estimate.estimator.describeBtn')}
                    </Button>
                  </Stack>
                  <Typography variant="overline" color="text.secondary">
                    {t('landing.or')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(4, 1fr)',
                        xl: `repeat(${Math.min(7, typologies.length)}, 1fr)`,
                      },
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    {typologies.map((ty) => (
                      <Choice
                        key={ty.id}
                        on={draft.typology === ty.id}
                        onClick={() => patch({ typology: ty.id })}
                        ariaLabel={ty.label}
                      >
                        <Typography
                          sx={{ fontFamily: FONT_MONO, fontSize: 10, color: 'text.secondary', letterSpacing: '0.08em' }}
                        >
                          {ty.id.slice(0, 3).toUpperCase()}
                        </Typography>
                        <Typography sx={{ fontWeight: 500 }}>{ty.label}</Typography>
                      </Choice>
                    ))}
                  </Box>
                </>
              )}
              {step === 1 && (
                <>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    {t('estimate.estimator.whereHowBig')}
                  </Typography>
                  <Box
                    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, maxWidth: 760 }}
                  >
                    <TextField
                      select
                      label={t('common.location')}
                      value={draft.locationId}
                      onChange={(e) => patch({ locationId: e.target.value })}
                      helperText={t('estimate.estimator.locationHelp')}
                    >
                      {config.locations.map((l) => (
                        <MenuItem key={l.id} value={l.id}>
                          {l.name}{' '}
                          <Box
                            component="span"
                            sx={{ fontFamily: FONT_MONO, fontSize: 12, color: 'text.secondary', ml: 1 }}
                          >
                            ×{l.factor.toFixed(2)}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                        {t('estimate.labels.floors')}
                      </Typography>
                      <ToggleButtonGroup
                        exclusive
                        fullWidth
                        value={Math.min(draft.storeys, 3)}
                        onChange={(_, v) => v && patch({ storeys: v })}
                      >
                        <ToggleButton value={1}>{t('estimate.floorOptions.ground')}</ToggleButton>
                        <ToggleButton value={2}>{t('estimate.floorOptions.plus1')}</ToggleButton>
                        <ToggleButton value={3}>{t('estimate.floorOptions.plus2')}</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    <TextField
                      type="number"
                      label={t('estimate.labels.floorArea')}
                      value={draft.gfa}
                      onChange={(e) => patch({ gfa: Number(e.target.value) })}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                          sx: { fontFamily: FONT_MONO },
                        },
                        htmlInput: { min: 20, step: 5 },
                      }}
                    />
                    <TextField
                      type="number"
                      label={t('wizard.bedrooms')}
                      value={draft.bedrooms}
                      onChange={(e) => {
                        const b = Number(e.target.value)
                        patch({ bedrooms: b, gfa: 60 + b * 40 })
                      }}
                      helperText={t('estimate.estimator.bedroomsHelp')}
                      slotProps={{ input: { sx: { fontFamily: FONT_MONO } }, htmlInput: { min: 0, max: 30 } }}
                    />
                  </Box>
                </>
              )}
              {step === 2 && (
                <>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    {t('wizard.finish')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
                      gap: 1,
                    }}
                  >
                    {QUALITY_LEVELS.map((q) => (
                      <Choice
                        key={q}
                        on={draft.quality === q}
                        onClick={() => patch({ quality: q })}
                        ariaLabel={qualityLabel(q)}
                      >
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.75 }}>
                          <QualityChip quality={q} />
                          <Typography sx={{ fontWeight: 600 }}>{qualityLabel(q)}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {config.qualities.find((x) => x.id === q)?.description}
                        </Typography>
                      </Choice>
                    ))}
                  </Box>
                  {extras.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 0.75 }}>
                        {t('wizard.extras')}
                      </Typography>
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                        {extras.map((f) => {
                          const on = draft.features.includes(f.id)
                          return (
                            <Chip
                              key={f.id}
                              label={f.label}
                              variant={on ? 'filled' : 'outlined'}
                              color={on ? 'primary' : 'default'}
                              onClick={() =>
                                patch({
                                  features: on ? draft.features.filter((x) => x !== f.id) : [...draft.features, f.id],
                                })
                              }
                            />
                          )
                        })}
                      </Stack>
                    </>
                  )}
                </>
              )}
              {step === 3 && result && (
                <>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="overline" color="text.secondary">
                      {t('estimate.estimator.result')}
                    </Typography>
                    <EstimateClassBadge estimateClass={result.estimateClass} />
                  </Stack>
                  <RangeHero
                    range={result.total}
                    label={t('result.range')}
                    estimateId={result.id}
                    figureId={result.totalFigureId}
                  />
                  <Stack direction="row" sx={{ gap: 4, mt: 2, mb: 2.5 }}>
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {t('result.perM2')}
                      </Typography>
                      <Typography variant="mono" component="p" sx={{ fontSize: 16 }}>
                        {formatMoney(result.costPerM2, 'RWF', i18n.language)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {t('result.duration')}
                      </Typography>
                      <Typography variant="mono" component="p" sx={{ fontSize: 16 }}>
                        {result.durationMonths} {t('common.months')}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ overflowX: 'auto', mb: 2 }}>
                    <Table size="small" sx={{ maxWidth: 640 }}>
                      <TableBody>
                        {result.phases
                          .filter((p) => p.amount > 0)
                          .map((p) => (
                            <TableRow key={p.code}>
                              <TableCell sx={{ pl: 0, fontFamily: FONT_MONO, color: 'text.secondary', width: 40 }}>
                                {p.code}
                              </TableCell>
                              <TableCell>{p.name}</TableCell>
                              <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                                {p.pct} %
                              </TableCell>
                              <TableCell align="right" sx={{ pr: 0 }}>
                                <Money value={p.amount} compact />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </Box>
                  <Alert severity="info" variant="outlined" sx={{ maxWidth: 640 }}>
                    {t('result.disclaimer', { label: result.classLabel.toLowerCase() })}
                  </Alert>
                </>
              )}
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Fade>
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              mt: 3,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {t('wizard.back')}
            </Button>
            {step < 3 ? (
              <Button
                variant="contained"
                color={step === 2 ? 'secondary' : 'primary'}
                endIcon={<ArrowForwardIcon />}
                onClick={next}
                disabled={running}
              >
                {step === 2 ? t('wizard.finish_btn') : t('wizard.next')}
              </Button>
            ) : (
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    result && void navigate({ to: '/estimate/$estimateId', params: { estimateId: result.id } })
                  }
                >
                  {t('estimate.estimator.fullBreakdown')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (!result) return
                    loadParams({ ...result.params, requestedClass: 2 })
                    void navigate({ to: '/estimate/new', search: { step: 'rooms' } })
                  }}
                >
                  {t('estimate.estimator.refineL2')}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={user ? undefined : <LockOutlinedIcon />}
                  onClick={save}
                >
                  {user ? t('result.save') : t('estimate.estimator.signInToSave')}
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>
        <Box
          sx={{
            borderLeft: { lg: 1 },
            borderTop: { xs: 1, lg: 0 },
            borderColor: 'divider',
            p: { xs: 2, md: 3 },
            bgcolor: 'surface.tertiary',
          }}
        >
          <Typography variant="overline" color="text.secondary">
            {t('estimate.estimator.specification')}
          </Typography>
          <Table size="small" sx={{ mt: 1, '& td': { px: 0, py: 0.75, borderBottomStyle: 'dashed' } }}>
            <TableBody>
              {summary.map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell sx={{ color: 'text.secondary', width: '40%' }}>{k}</TableCell>
                  <TableCell sx={{ fontFamily: FONT_MONO, fontSize: 12.5 }}>{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {t('estimate.estimator.levelNote', {
              label: config.classes.find((c) => c.level === 1)?.label.toLowerCase(),
              pct: config.classes.find((c) => c.level === 1)?.rangePct,
            })}
          </Typography>
        </Box>
      </Box>
      {result && (
        <SaveProjectDialog
          open={saveOpen}
          onClose={() => setSaveOpen(false)}
          params={result.params}
          estimateId={result.id}
        />
      )}
    </Box>
  )
}
