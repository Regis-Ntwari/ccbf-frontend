import { LineChart } from '@mui/x-charts/LineChart'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/shared/lib/format'
import { useChartPalette } from '../QualityChip'

/** Cumulative cash-flow S-curve with monthly spend as a second (same-unit) series. */
export function SCurveChart({ points, height = 260 }: { points: Array<{ month: number; amount: number; cumulative: number }>; height?: number }) {
  const { i18n } = useTranslation()
  const palette = useChartPalette()
  const fmt = (v: number | null) => (v == null ? '' : formatMoney(v, 'RWF', i18n.language, { compact: true }))
  return (
    <Box sx={{ width: '100%', '& .MuiChartsAxis-tickLabel': { fill: palette.text } }}>
      <LineChart
        height={height}
        xAxis={[{ data: points.map((p) => p.month), label: 'Month', scaleType: 'linear', valueFormatter: (v: number) => `M${v}` }]}
        yAxis={[{ valueFormatter: (v: number) => fmt(v), width: 70 }]}
        series={[
          { data: points.map((p) => p.cumulative), label: 'Cumulative', color: palette.series[0], area: true, showMark: false, valueFormatter: fmt },
          { data: points.map((p) => p.amount), label: 'Monthly', color: palette.series[1], showMark: false, valueFormatter: fmt },
        ]}
        grid={{ horizontal: true }}
        margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
        sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 }, '& .MuiChartsGrid-line': { stroke: palette.grid } }}
      />
    </Box>
  )
}
