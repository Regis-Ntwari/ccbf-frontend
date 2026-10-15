import { BarChart } from '@mui/x-charts/BarChart'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

import { formatMoney } from '@/shared/lib/format'
import { useChartPalette } from '../QualityChip'
import { FONT_MONO } from '@/shared/theme/theme'

/**
 * Horizontal single-series bar chart of cost by phase.
 * One hue (magnitude job), thin rounded marks, labels in text tokens, hover tooltip.
 */
export function PhaseChart({ phases, height }) {
  const { i18n } = useTranslation()
  const palette = useChartPalette()
  const rows = phases.filter((p) => p.amount > 0)
  const h = height ?? Math.max(220, rows.length * 34 + 60)
  return (
    <Box
      sx={{ width: '100%', '& .MuiChartsAxis-tickLabel': { fill: palette.text, fontFamily: FONT_MONO, fontSize: 11 } }}
    >
      <BarChart
        layout="horizontal"
        height={h}
        hideLegend
        borderRadius={2}
        yAxis={[
          { scaleType: 'band', data: rows.map((p) => `${p.code} ${p.name}`), width: 170, categoryGapRatio: 0.35 },
        ]}
        xAxis={[{ valueFormatter: (v) => formatMoney(v, 'RWF', i18n.language, { compact: true }) }]}
        series={[
          {
            data: rows.map((p) => p.amount),
            color: palette.series[0],
            label: 'Cost',
            valueFormatter: (v, ctx) =>
              v == null ? '' : `${formatMoney(v, 'RWF', i18n.language)} · ${rows[ctx.dataIndex]?.pct ?? ''} %`,
          },
        ]}
        grid={{ vertical: true }}
        margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
        sx={{ '& .MuiChartsGrid-line': { stroke: palette.grid } }}
      />
    </Box>
  )
}
