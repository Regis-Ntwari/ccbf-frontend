import { useQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/components/States'
import { QualityChip } from '@/shared/components/QualityChip'
import { Money } from '@/shared/components/Money'
import { estimateQuery } from '@/features/estimate/api'
import { useScenarioStore } from '@/shared/stores'
import { PHASE_CODES } from '@/shared/api/schemas'
import { formatRange } from '@/shared/lib/format'

/** Scenario comparison across up to four estimates (Feature 11). */
export function ComparePage() {
  const { t, i18n } = useTranslation()
  const compare = useScenarioStore((s) => s.compare)
  const remove = useScenarioStore((s) => s.remove)
  const clear = useScenarioStore((s) => s.clear)
  const results = useQueries({ queries: compare.map((c) => estimateQuery(c.estimateId)) })

  if (!compare.length) {
    return (
      <Box>
        <PageHeader title={t('nav.compare')} />
        <EmptyState
          title={t('estimate.compare.empty')}
          description={t('estimate.compare.emptyText', { compare: t('nav.compare') })}
          action={
            <Button component={Link} to="/estimate/new" variant="contained">
              {t('estimate.compare.start')}
            </Button>
          }
        />
      </Box>
    )
  }
  const rows = [
    {
      label: t('estimate.compare.rowType'),
      render: (i) => {
        const e = results[i]?.data
        if (!e) return '…'
        const floors = t(e.params.storeys === 1 ? 'estimate.floors_one' : 'estimate.floors_other', {
          n: e.params.storeys,
        })
        return `${t(`typology.${e.params.typology}`)} · ${e.params.gfa} m² · ${floors}`
      },
    },
    {
      label: t('estimate.labels.finish'),
      render: (i) => {
        const e = results[i]?.data
        return e ? <QualityChip quality={e.params.quality} /> : null
      },
    },
    {
      label: t('result.range'),
      render: (i) => {
        const e = results[i]?.data
        return e ? formatRange(e.total, 'RWF', i18n.language) : '…'
      },
    },
    {
      label: t('estimate.compare.mostLikely'),
      render: (i) => {
        const e = results[i]?.data
        return e ? <Money value={e.total.mid} /> : '…'
      },
    },
    {
      label: t('estimate.compare.perM2'),
      render: (i) => {
        const e = results[i]?.data
        return e ? <Money value={e.costPerM2} /> : '…'
      },
    },
    {
      label: t('result.duration'),
      render: (i) => {
        const e = results[i]?.data
        return e ? `${e.durationMonths} ${t('common.months')}` : '…'
      },
    },
    ...PHASE_CODES.map((code) => ({
      label: code,
      render: (i) => {
        const p = results[i]?.data?.phases.find((x) => x.code === code)
        return p ? <Money value={p.amount} compact /> : '…'
      },
    })),
  ]
  const best = results.reduce(
    (b, r, i) => (r.data && (b < 0 || (results[b]?.data?.total.mid ?? Infinity) > r.data.total.mid) ? i : b),
    -1,
  )
  return (
    <Box>
      <PageHeader
        title={t('nav.compare')}
        actions={<Button onClick={clear}>{t('estimate.compare.clearAll')}</Button>}
      />
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              {compare.map((c, i) => (
                <TableCell
                  key={c.estimateId}
                  sx={{ fontWeight: 700, bgcolor: i === best ? 'action.selected' : undefined }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Link to="/estimate/$estimateId" params={{ estimateId: c.estimateId }}>
                      {c.label}
                    </Link>
                    <IconButton
                      size="small"
                      aria-label={t('estimate.compare.remove')}
                      onClick={() => remove(c.estimateId)}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.label}>
                <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{r.label}</TableCell>
                {compare.map((c, i) => (
                  <TableCell
                    key={c.estimateId}
                    sx={{ fontVariantNumeric: 'tabular-nums', bgcolor: i === best ? 'action.selected' : undefined }}
                  >
                    {r.render(i)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
