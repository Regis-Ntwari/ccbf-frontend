import { BarChart } from '@mui/x-charts/BarChart'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import type { PhaseCost } from '@/shared/api/schemas'
import { formatMoney } from '@/shared/lib/format'
import { useChartPalette } from '../QualityChip'

/**
 * Horizontal single-series bar chart of cost by phase.
 * One hue (magnitude job), thin rounded marks, labels in text tokens, hover tooltip.
 */
export function PhaseChart({ phases, height }: { phases: PhaseCost[]; height?: number }) {
  const { i18n } = useTranslation()
  const palette = useChartPalette()
  const rows = phases.filter((p) => p.amount > 0)
  const h = height ?? Math.max(220, rows.length * 34 + 60)
  return (
    <Box sx={{ width: '100%', '& .MuiChartsAxis-tickLabel': { fill: palette.text } }}>
      <BarChart
        layout="horizontal"
        height={h}
        hideLegend
        borderRadius={4}
        yAxis={[{ scaleType: 'band', data: rows.map((p) => `${p.code} ${p.name}`), width: 170, categoryGapRatio: 0.35 }]}
        xAxis={[{ valueFormatter: (v: number) => formatMoney(v, 'RWF', i18n.language, { compact: true }) }]}
        series={[
          {
            data: rows.map((p) => p.amount),
            color: palette.series[0],
            label: 'Cost',
            valueFormatter: (v, ctx) => (v == null ? '' : `${formatMoney(v, 'RWF', i18n.language)} · ${rows[ctx.dataIndex]?.pct ?? ''} %`),
          },
        ]}
        grid={{ vertical: true }}
        margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
        sx={{ '& .MuiChartsGrid-line': { stroke: palette.grid } }}
      />
    </Box>
  )
}
