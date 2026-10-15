import Chip from '@mui/material/Chip'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from '@mui/material/styles'

import { CHART, TOKENS } from '@/shared/theme/theme'

const INDEX = { ECO: 0, STD: 1, PRM: 2, LUX: 3 }

export function useChartPalette() {
  const { mode, systemMode } = useColorScheme()
  const dark = (mode === 'system' ? systemMode : mode) === 'dark'
  return dark ? CHART.dark : CHART.light
}

/** Quality level tag on the ordinal olive ramp; text colour chosen for contrast on each step. */
export function QualityChip({ quality, size = 'small' }) {
  const { t } = useTranslation()
  const palette = useChartPalette()
  const i = INDEX[quality]
  const bg = palette.quality[i]
  const dark = palette === CHART.dark
  const lightText = dark ? i < 2 : i >= 2
  return (
    <Chip
      size={size}
      label={t(`quality.${quality}`)}
      sx={{ bgcolor: bg, color: lightText ? TOKENS.warmWhite : TOKENS.charcoal, fontWeight: 500 }}
    />
  )
}
