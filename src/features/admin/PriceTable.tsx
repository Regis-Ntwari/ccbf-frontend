import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  columnFilteringFeature,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableContainer from '@mui/material/TableContainer'
import TableSortLabel from '@mui/material/TableSortLabel'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import type { PriceRecord } from '@/shared/api/schemas'
import { Money } from '@/shared/components/Money'
import { daysSince, formatDate } from '@/shared/lib/format'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  globalFilteringFeature,
})
const helper = createColumnHelper<typeof features, PriceRecord>()
const EMPTY: PriceRecord[] = []

/** Reusable sortable/filterable price table with provenance chips. */
export function PriceTable({ rows, globalFilter, actions }: { rows: PriceRecord[] | undefined; globalFilter: string; actions?: (r: PriceRecord) => React.ReactNode }) {
  const { i18n } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'sourceDate', desc: true }])
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('materialId', { header: 'ID', sortFn: 'alphanumeric' }),
        helper.accessor('name', { header: 'Material', cell: (c) => <>{c.getValue()} <span style={{ opacity: 0.7 }}>{c.row.original.spec}</span></> }),
        helper.accessor('category', { header: 'Category' }),
        helper.accessor('quality', { header: 'Quality', cell: (c) => <Chip size="small" label={c.getValue()} variant="outlined" /> }),
        helper.accessor('price', { header: 'Price', sortFn: 'basic', meta: { align: 'right' }, cell: (c) => <><Money value={c.getValue()} /> <span style={{ opacity: 0.7 }}>/ {c.row.original.purchaseUnit}</span></> }),
        helper.accessor('wastePct', { header: 'Waste', meta: { align: 'right' }, cell: (c) => `${c.getValue()} %` }),
        helper.accessor('locationId', { header: 'Location' }),
        helper.accessor('sourceDate', {
          header: 'Source / date',
          cell: (c) => {
            const stale = daysSince(c.getValue()) > 90
            return (
              <Stack>
                <span>{c.row.original.source}</span>
                <Chip size="small" label={`${formatDate(c.getValue(), i18n.language)}${stale ? ' · stale' : ''}`} color={stale ? 'error' : 'default'} variant="outlined" sx={{ height: 18, fontSize: 10, alignSelf: 'flex-start' }} />
              </Stack>
            )
          },
        }),
        helper.accessor('confidence', { header: 'Confidence', cell: (c) => <Chip size="small" label={`${c.getValue()}${c.row.original.verified ? ' ✓' : ''}`} color={c.getValue() === 'high' ? 'success' : c.getValue() === 'medium' ? 'warning' : 'error'} variant="outlined" /> }),
        helper.accessor('anomalyPct', { header: 'vs current', sortFn: 'basic', meta: { align: 'right' }, cell: (c) => (c.getValue() == null ? '—' : <span style={{ color: Math.abs(c.getValue()!) > 25 ? '#d03b3b' : undefined, fontWeight: Math.abs(c.getValue()!) > 25 ? 700 : 400 }}>{c.getValue()! > 0 ? '+' : ''}{c.getValue()} %</span>) }),
        helper.accessor('status', { header: 'Status', cell: (c) => <Chip size="small" label={c.getValue()} color={c.getValue() === 'approved' ? 'success' : c.getValue() === 'flagged' ? 'error' : c.getValue() === 'pending' ? 'warning' : 'default'} /> }),
        helper.display({ id: 'actions', header: '', cell: (c) => actions?.(c.row.original) ?? null }),
      ]),
    [i18n.language, actions],
  )
  const table = useTable({
    features,
    columns,
    data: rows ?? EMPTY,
    getRowId: (r) => r.id,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    globalFilterFn: 'includesString',
  })
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" sx={{ minWidth: 1000 }}>
        <TableHead>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableCell key={h.id} align={(h.column.columnDef.meta as { align?: 'right' } | undefined)?.align ?? 'left'}>
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <TableSortLabel active={Boolean(h.column.getIsSorted())} direction={h.column.getIsSorted() || 'asc'} onClick={h.column.getToggleSortingHandler()}>
                      <table.FlexRender header={h} />
                    </TableSortLabel>
                  ) : (
                    <table.FlexRender header={h} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} align={(cell.column.columnDef.meta as { align?: 'right' } | undefined)?.align ?? 'left'} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <TableRow><TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.secondary' }}>No records</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
