import Chip from '@mui/material/Chip'
import { useTranslation } from 'react-i18next'
import type { QualityLevel } from '@/shared/api/schemas'
import { CHART } from '@/shared/theme/theme'
import { useColorScheme } from '@mui/material/styles'

const INDEX: Record<QualityLevel, number> = { ECO: 0, STD: 1, PRM: 2, LUX: 3 }

export function QualityChip({ quality, size = 'small' }: { quality: QualityLevel; size?: 'small' | 'medium' }) {
  const { t } = useTranslation()
  const { mode, systemMode } = useColorScheme()
  const dark = (mode === 'system' ? systemMode : mode) === 'dark'
  const color = (dark ? CHART.dark : CHART.light).quality[INDEX[quality]]
  return <Chip size={size} label={t(`quality.${quality}`)} sx={{ bgcolor: color, color: dark ? '#0b0b0b' : '#fff', fontWeight: 700 }} />
}

export function useChartPalette() {
  const { mode, systemMode } = useColorScheme()
  const dark = (mode === 'system' ? systemMode : mode) === 'dark'
  return dark ? CHART.dark : CHART.light
}
