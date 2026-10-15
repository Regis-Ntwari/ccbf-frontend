import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'

import { ELEMENT_GROUPS, FEATURE_FLAGS, QUALITY_LEVELS, TypologySchema } from '@/shared/api/schemas'
import { useConfig } from '@/features/config/api'

import { useLocations } from '../api'

/** Feature (extra) labels come from the public config, already in the visitor's language. */
export function useFeatureLabel() {
  const config = useConfig()
  return (id) => config.data?.features.find((f) => f.id === id)?.label ?? id
}

/** Element-group labels come from the public config, already in the visitor's language. */
export function useElementLabel() {
  const config = useConfig()
  return (group) => config.data?.elementLabels?.[group] ?? group
}

function Stepper({ label, value, onChange, min = 0, max = 50 }) {
  const { t } = useTranslation()
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
      <Typography>{label}</Typography>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <IconButton
          aria-label={t('estimate.wizardUi.decrease', { label })}
          onClick={() => onChange(Math.max(min, value - 1))}
          size="small"
        >
          <RemoveIcon />
        </IconButton>
        <Typography sx={{ minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
        <IconButton
          aria-label={t('estimate.wizardUi.increase', { label })}
          onClick={() => onChange(Math.min(max, value + 1))}
          size="small"
        >
          <AddIcon />
        </IconButton>
      </Stack>
    </Stack>
  )
}

export function StepWhat({ draft, setDraft, errors }) {
  const { t } = useTranslation()
  return (
    <>
      {errors['typology'] && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors['typology']}
        </Alert>
      )}
      <Grid container spacing={1.5}>
        {TypologySchema.options.map((ty) => (
          <Grid key={ty} size={{ xs: 6, sm: 4 }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: draft.typology === ty ? 'primary.main' : 'divider',
                borderWidth: draft.typology === ty ? 2 : 1,
              }}
            >
              <CardActionArea
                onClick={() => setDraft({ typology: ty })}
                sx={{ py: 2.5, textAlign: 'center' }}
                aria-pressed={draft.typology === ty}
              >
                <Typography variant="subtitle1">{t(`typology.${ty}`)}</Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  )
}

export function StepWhere({ draft, setDraft, errors }) {
  const { t } = useTranslation()
  const locations = useLocations()
  return (
    <Stack spacing={2}>
      <TextField
        select
        label={t('common.location')}
        value={draft.locationId ?? ''}
        onChange={(e) => setDraft({ locationId: e.target.value })}
        error={Boolean(errors['locationId'])}
        helperText={errors['locationId'] ?? t('estimate.wizardUi.locationHelp')}
        fullWidth
      >
        {(locations.data ?? []).map((l) => (
          <MenuItem key={l.id} value={l.id}>
            {l.name}{' '}
            <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
              ({l.province}, ×{l.factor.toFixed(2)})
            </Typography>
          </MenuItem>
        ))}
      </TextField>
      <Chip
        label={t('wizard.dontKnow')}
        variant={draft.locationId === 'kigali' ? 'filled' : 'outlined'}
        onClick={() => setDraft({ locationId: 'kigali' })}
        sx={{ alignSelf: 'flex-start' }}
      />
    </Stack>
  )
}

export function StepSize({ draft, setDraft, errors }) {
  const { t } = useTranslation()
  const suggested = 60 + (draft.bedrooms ?? 3) * 40
  return (
    <Stack spacing={2}>
      <TextField
        type="number"
        label={t('wizard.knowSize')}
        value={draft.gfa ?? ''}
        onChange={(e) => setDraft({ gfa: e.target.value === '' ? undefined : Number(e.target.value) })}
        error={Boolean(errors['gfa'])}
        helperText={errors['gfa'] ?? t('estimate.wizardUi.gfaHelp')}
        slotProps={{
          input: { endAdornment: <InputAdornment position="end">m²</InputAdornment> },
          htmlInput: { min: 20, max: 50000, step: 5 },
        }}
        fullWidth
      />
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {t('wizard.helpSize')}
        </Typography>
        <Stepper
          label={t('wizard.bedrooms')}
          value={draft.bedrooms ?? 3}
          onChange={(v) => setDraft({ bedrooms: v })}
          max={20}
        />
        <Chip
          label={t('estimate.wizardUi.suggest', { m2: suggested, n: draft.bedrooms ?? 3 })}
          onClick={() => setDraft({ gfa: suggested })}
          color={draft.gfa === suggested ? 'primary' : 'default'}
        />
      </Box>
    </Stack>
  )
}

export function StepFloors({ draft, setDraft }) {
  const { t } = useTranslation()
  return (
    <ToggleButtonGroup
      exclusive
      value={Math.min(draft.storeys ?? 1, 3)}
      onChange={(_, v) => v && setDraft({ storeys: v })}
      fullWidth
    >
      <ToggleButton value={1} sx={{ py: 3, flexDirection: 'column' }}>
        <Typography variant="h3">1</Typography>
        <Typography variant="caption">{t('estimate.floorOptions.groundOnly')}</Typography>
      </ToggleButton>
      <ToggleButton value={2} sx={{ py: 3, flexDirection: 'column' }}>
        <Typography variant="h3">2</Typography>
        <Typography variant="caption">{t('estimate.floorOptions.plus1')}</Typography>
      </ToggleButton>
      <ToggleButton value={3} sx={{ py: 3, flexDirection: 'column' }}>
        <Typography variant="h3">3+</Typography>
        <Typography variant="caption">{t('estimate.floorOptions.plus2More')}</Typography>
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export function StepRooms({ draft, setDraft }) {
  const { t } = useTranslation()
  const rooms = draft.rooms ?? { garage: false, office: false, store: false, separateKitchen: false }
  return (
    <Stack>
      <Stepper label={t('wizard.bedrooms')} value={draft.bedrooms ?? 0} onChange={(v) => setDraft({ bedrooms: v })} />
      <Stepper
        label={t('wizard.bathrooms')}
        value={draft.bathrooms ?? 0}
        onChange={(v) => setDraft({ bathrooms: v })}
      />
      <Grid container>
        {['garage', 'office', 'store', 'separateKitchen'].map((k) => (
          <Grid key={k} size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rooms[k]}
                  onChange={(e) => setDraft({ rooms: { ...rooms, [k]: e.target.checked } })}
                />
              }
              label={t(`wizard.${k}`)}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export function StepFinish({ draft, setDraft }) {
  const { t } = useTranslation()
  const config = useConfig()
  const blurb = (q) => config.data?.qualities.find((x) => x.id === q)?.description ?? ''
  return (
    <Grid container spacing={1.5}>
      {QUALITY_LEVELS.map((q) => (
        <Grid key={q} size={{ xs: 12, sm: 6 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderColor: draft.quality === q ? 'primary.main' : 'divider',
              borderWidth: draft.quality === q ? 2 : 1,
            }}
          >
            <CardActionArea
              onClick={() => setDraft({ quality: q })}
              sx={{ height: '100%' }}
              aria-pressed={draft.quality === q}
            >
              <CardContent>
                <Typography variant="h5">{t(`quality.${q}`)}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {blurb(q)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export function StepElements({ draft, setDraft }) {
  const { t } = useTranslation()
  const elementLabel = useElementLabel()
  const overrides = draft.elementOverrides ?? {}
  return (
    <Stack spacing={1}>
      <Typography color="text.secondary" variant="body2">
        {t('estimate.wizardUi.elementsHint', { quality: t(`quality.${draft.quality ?? 'STD'}`) })}
      </Typography>
      {ELEMENT_GROUPS.map((g) => (
        <Stack
          key={g}
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1 }}
        >
          <Typography>{elementLabel(g)}</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={overrides[g] ?? 'default'}
            onChange={(_, v) => {
              if (!v) return
              const next = { ...overrides }
              if (v === 'default') delete next[g]
              else next[g] = v
              setDraft({ elementOverrides: next })
            }}
          >
            <ToggleButton value="default">{t('estimate.wizardUi.default')}</ToggleButton>
            {QUALITY_LEVELS.map((q) => (
              <ToggleButton key={q} value={q}>
                {q}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      ))}
    </Stack>
  )
}

export function StepExtras({ draft, setDraft }) {
  const featureLabel = useFeatureLabel()
  const features = draft.features ?? []
  const toggle = (f) =>
    setDraft({ features: features.includes(f) ? features.filter((x) => x !== f) : [...features, f] })
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
      {FEATURE_FLAGS.map((f) => (
        <Chip
          key={f}
          label={featureLabel(f)}
          color={features.includes(f) ? 'primary' : 'default'}
          variant={features.includes(f) ? 'filled' : 'outlined'}
          onClick={() => toggle(f)}
          sx={{ py: 2.5, px: 1, fontSize: 15 }}
        />
      ))}
    </Stack>
  )
}

export function StepPlot({ draft, setDraft }) {
  const { t } = useTranslation()
  const site = draft.site ?? { ownsLand: null, plotSizeM2: null, sloping: 'unknown' }
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {t('wizard.ownLand')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={site.ownsLand === null || site.ownsLand === undefined ? 'unknown' : site.ownsLand ? 'yes' : 'no'}
          onChange={(_, v) => v && setDraft({ site: { ...site, ownsLand: v === 'unknown' ? null : v === 'yes' } })}
        >
          <ToggleButton value="yes">{t('estimate.yes')}</ToggleButton>
          <ToggleButton value="no">{t('estimate.no')}</ToggleButton>
          <ToggleButton value="unknown">{t('wizard.dontKnow')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <TextField
        type="number"
        label={t('wizard.plotSize')}
        value={site.plotSizeM2 ?? ''}
        onChange={(e) =>
          setDraft({ site: { ...site, plotSizeM2: e.target.value === '' ? null : Number(e.target.value) } })
        }
        slotProps={{ input: { endAdornment: <InputAdornment position="end">m²</InputAdornment> } }}
      />
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {t('wizard.slope')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={site.sloping ?? 'unknown'}
          onChange={(_, v) => v && setDraft({ site: { ...site, sloping: v } })}
        >
          {['flat', 'gentle', 'steep', 'unknown'].map((s) => (
            <ToggleButton key={s} value={s}>
              {t(`wizard.${s}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Stack>
  )
}

export function StepBudget({ draft, setDraft }) {
  const { t } = useTranslation()
  return (
    <Stack spacing={2}>
      <TextField
        type="number"
        label={t('wizard.budgetOptional')}
        value={draft.budget ?? ''}
        onChange={(e) => setDraft({ budget: e.target.value === '' ? null : Number(e.target.value) })}
        slotProps={{ input: { endAdornment: <InputAdornment position="end">RWF</InputAdornment> } }}
      />
      <TextField
        type="number"
        label={t('wizard.months')}
        value={draft.targetCompletionMonths ?? ''}
        onChange={(e) => setDraft({ targetCompletionMonths: e.target.value === '' ? null : Number(e.target.value) })}
      />
    </Stack>
  )
}
