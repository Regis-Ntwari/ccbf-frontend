import { useTranslation } from 'react-i18next'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import { QUALITY_LEVELS, TypologySchema } from '@/shared/api/schemas'

import { useLocations } from './api'

/** Compact editor for the key engine inputs, reused by stage reach, cost-to-complete and project settings. */
export function ParamsQuickForm({ value, onChange, errors = {} }) {
  const { t } = useTranslation()
  const locations = useLocations()
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          select
          fullWidth
          label={t('estimate.labels.type')}
          value={value.typology ?? ''}
          onChange={(e) => onChange({ typology: e.target.value })}
          error={Boolean(errors['typology'])}
          helperText={errors['typology']}
        >
          {TypologySchema.options.map((ty) => (
            <MenuItem key={ty} value={ty}>
              {t(`typology.${ty}`)}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          select
          fullWidth
          label={t('common.location')}
          value={value.locationId ?? ''}
          onChange={(e) => onChange({ locationId: e.target.value })}
          error={Boolean(errors['locationId'])}
          helperText={errors['locationId']}
        >
          {(locations.data ?? []).map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <TextField
          type="number"
          fullWidth
          label={t('estimate.labels.area')}
          value={value.gfa ?? ''}
          onChange={(e) => onChange({ gfa: Number(e.target.value) })}
          error={Boolean(errors['gfa'])}
          helperText={errors['gfa']}
          slotProps={{
            input: { endAdornment: <InputAdornment position="end">m²</InputAdornment> },
            htmlInput: { min: 20, step: 5 },
          }}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <TextField
          type="number"
          fullWidth
          label={t('estimate.labels.floors')}
          value={value.storeys ?? 1}
          onChange={(e) => onChange({ storeys: Number(e.target.value) })}
          slotProps={{ htmlInput: { min: 1, max: 30 } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <TextField
          select
          fullWidth
          label={t('estimate.labels.finish')}
          value={value.quality ?? 'STD'}
          onChange={(e) => onChange({ quality: e.target.value })}
        >
          {QUALITY_LEVELS.map((q) => (
            <MenuItem key={q} value={q}>
              {t(`quality.${q}`)}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  )
}

export const DEFAULT_PARAMS = {
  typology: 'house',
  locationId: 'kigali',
  gfa: 180,
  storeys: 1,
  bedrooms: 3,
  bathrooms: 2,
  rooms: { garage: false, office: false, store: false, separateKitchen: false },
  quality: 'STD',
  elementOverrides: {},
  features: [],
  site: { ownsLand: null, plotSizeM2: null, sloping: 'unknown' },
  budget: null,
  targetCompletionMonths: null,
  requestedClass: 1,
}
