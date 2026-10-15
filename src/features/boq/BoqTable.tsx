import { Fragment, useMemo, useState } from 'react'
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
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableContainer from '@mui/material/TableContainer'
import TableSortLabel from '@mui/material/TableSortLabel'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import DownloadIcon from '@mui/icons-material/Download'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import { TraceButton } from '@/shared/components/TraceButton'
import { Money } from '@/shared/components/Money'
import type { Boq, BoqItem, BoqStatus } from '@/shared/api/schemas'
import { useCurrentUser } from '@/shared/stores'
import { can } from '@/shared/lib/permissions'
import { formatDate, formatNumber } from '@/shared/lib/format'
import { ApiError } from '@/shared/api/client'
import { useBoq, useExportBoq, useOverrideItem, useResetOverride, useTransitionBoq } from './api'
import { OverrideDialog } from './OverrideDialog'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  globalFilteringFeature,
})
const helper = createColumnHelper<typeof features, BoqItem>()
const EMPTY: BoqItem[] = []

const STATUS_COLOR: Record<BoqStatus, 'default' | 'info' | 'success' | 'primary'> = { draft: 'default', review: 'info', approved: 'success', issued: 'primary' }
const NEXT: Record<BoqStatus, { label: string; to: BoqStatus; approver: boolean } | null> = {
  draft: { label: 'Submit for review', to: 'review', approver: false },
  review: { label: 'Approve', to: 'approved', approver: true },
  approved: { label: 'Issue', to: 'issued', approver: true },
  issued: null,
}

/**
 * Professional editable BOQ (Section 11): quantity source badge, waste, rate
 * provenance, overrides with reason, click-through trace, versioned workflow
 * (draft → review → approved → issued) and exports blocked by stale prices.
 */
export function BoqTable({ projectId }: { projectId: string }) {
  const { i18n } = useTranslation()
  const user = useCurrentUser()
  const boq = useBoq(projectId)
  const override = useOverrideItem(projectId)
  const reset = useResetOverride(projectId)
  const transition = useTransitionBoq(projectId)
  const exportBoq = useExportBoq(projectId)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'code', desc: false }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [phase, setPhase] = useState('')
  const [editing, setEditing] = useState<BoqItem | null>(null)
  const editable = can(user, 'edit_overrides') && boq.data?.status !== 'issued'

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('code', { header: 'Item', sortFn: 'alphanumeric' }),
        helper.accessor('description', {
          header: 'Description',
          cell: (c) => (
            <Box>
              {c.getValue()}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{c.row.original.trade} · {c.row.original.formula}</Typography>
            </Box>
          ),
        }),
        helper.accessor('unit', { header: 'Unit', enableSorting: false }),
        helper.accessor('qty', {
          header: 'Qty',
          sortFn: 'basic',
          meta: { align: 'right' },
          cell: (c) => (
            <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
              <span>{formatNumber(c.getValue(), i18n.language, 2)}</span>
              <Chip size="small" label={c.row.original.qtySource} variant="outlined" color={c.row.original.qtySource === 'manual' ? 'warning' : 'default'} sx={{ height: 18, fontSize: 10 }} />
            </Stack>
          ),
        }),
        helper.accessor('wastePct', { header: 'Waste', meta: { align: 'right' }, cell: (c) => `${c.getValue()} %` }),
        helper.accessor('rate', {
          header: 'Rate',
          sortFn: 'basic',
          meta: { align: 'right' },
          cell: (c) => {
            const p = c.row.original.rateProvenance
            return (
              <Stack sx={{ alignItems: 'flex-end' }}>
                <Money value={c.getValue()} />
                {p ? (
                  <Tooltip title={`${p.source} · ${formatDate(p.sourceDate, i18n.language)} · ${p.confidence} confidence${p.verified ? ' · verified' : ''}`}>
                    <Chip size="small" label={p.stale ? 'stale' : p.confidence} color={p.stale ? 'error' : p.confidence === 'high' ? 'success' : 'default'} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                  </Tooltip>
                ) : (
                  <Chip size="small" label={c.row.original.unit === 'sum' || c.row.original.unit === 'PC' ? 'allowance' : 'no price'} color={c.row.original.unit === 'sum' || c.row.original.unit === 'PC' ? 'default' : 'error'} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                )}
              </Stack>
            )
          },
        }),
        helper.accessor('amount', { header: 'Amount', sortFn: 'basic', meta: { align: 'right' }, cell: (c) => <Money value={c.getValue()} sx={{ fontWeight: c.row.original.override ? 700 : 400 }} /> }),
        helper.display({
          id: 'actions',
          header: '',
          cell: (c) => (
            <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
              <TraceButton estimateId={c.row.original.id.split(':')[0] ?? ''} figureId={c.row.original.figureId} />
              {editable && (
                <Tooltip title={c.row.original.override ? `Override by ${c.row.original.override.changedBy}: ${c.row.original.override.reason}` : 'Edit quantity / rate / waste'}>
                  <IconButton size="small" aria-label="Edit item" color={c.row.original.override ? 'warning' : 'default'} onClick={() => setEditing(c.row.original)}><EditOutlinedIcon fontSize="inherit" /></IconButton>
                </Tooltip>
              )}
              {editable && c.row.original.override && (
                <Tooltip title="Reset to default">
                  <IconButton size="small" aria-label="Reset override" onClick={() => reset.mutate(c.row.original.id)}><RestartAltIcon fontSize="inherit" /></IconButton>
                </Tooltip>
              )}
            </Stack>
          ),
        }),
      ]),
    [i18n.language, editable, reset],
  )

  const data = useMemo(() => (boq.data ? boq.data.bills.flatMap((b) => b.items).filter((i) => !phase || i.phase === phase) : EMPTY), [boq.data, phase])

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (r) => r.id,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
  })

  if (boq.isPending) return <PageSkeleton />
  if (boq.isError) return <ErrorState error={boq.error} onRetry={() => void boq.refetch()} />
  const b: Boq = boq.data
  const next = NEXT[b.status]
  const canAdvance = next && (!next.approver || can(user, 'approve_boq'))
  const blocked = b.exportBlockedReasons.length > 0
  const rows = table.getRowModel().rows
  const billName = (code: string) => b.bills.find((x) => x.code === code)?.name ?? code
  const grouped = sorting[0]?.id === 'code'

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1, mb: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={`v${b.version} · ${b.status}`} color={STATUS_COLOR[b.status]} />
          <Chip label={b.classLabel} variant="outlined" color="warning" size="small" />
          <Typography variant="caption" color="text.secondary">Updated {formatDate(b.updatedAt, i18n.language)} by {b.updatedBy}</Typography>
        </Stack>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {b.status !== 'draft' && can(user, 'edit_overrides') && <Button size="small" onClick={() => transition.mutate('draft')}>{b.status === 'issued' ? 'New revision' : 'Back to draft'}</Button>}
          {next && <Button size="small" variant="contained" disabled={!canAdvance || transition.isPending} onClick={() => transition.mutate(next.to)}>{next.label}</Button>}
          <Tooltip title={blocked ? 'Export blocked: stale or missing prices' : 'Export'}>
            <span>
              <ButtonGroup size="small" variant="outlined" disabled={blocked || exportBoq.isPending || !can(user, 'export_boq')}>
                <Button startIcon={<DownloadIcon />} onClick={() => exportBoq.mutate('xlsx')}>Excel</Button>
                <Button onClick={() => exportBoq.mutate('pdf')}>PDF</Button>
                <Button onClick={() => exportBoq.mutate('csv')}>CSV</Button>
              </ButtonGroup>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
      {blocked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Professional BOQ export and issue are blocked until these prices are refreshed:
          <Box component="ul" sx={{ m: 0, pl: 2 }}>{b.exportBlockedReasons.map((r) => <li key={r}>{r}</li>)}</Box>
        </Alert>
      )}
      {transition.isError && <ErrorState error={transition.error} />}
      {exportBoq.isError && <ErrorState error={exportBoq.error} />}
      {exportBoq.data?.note && <Alert severity="info" sx={{ mb: 2 }}>{exportBoq.data.note}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, mb: 1 }}>
        <TextField size="small" placeholder="Filter items…" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} sx={{ minWidth: 240 }} slotProps={{ htmlInput: { 'aria-label': 'Filter items' } }} />
        <TextField size="small" select label="Phase" value={phase} onChange={(e) => setPhase(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All phases</MenuItem>
          {[...new Set(b.bills.map((x) => x.phase).filter(Boolean))].map((p) => <MenuItem key={p} value={p!}>{p}</MenuItem>)}
        </TextField>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ minWidth: 900 }}>
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
            {rows.map((row, i) => {
              const prev = rows[i - 1]
              const newBill = grouped && (!prev || prev.original.billCode !== row.original.billCode)
              return (
                <Fragment key={row.id}>
                  {newBill && (
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell colSpan={8} sx={{ fontWeight: 700 }}>Bill {row.original.billCode}: {billName(row.original.billCode)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow hover sx={{ bgcolor: row.original.override ? 'rgba(201,133,0,0.06)' : undefined }}>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id} align={(cell.column.columnDef.meta as { align?: 'right' } | undefined)?.align ?? 'left'} sx={{ fontVariantNumeric: 'tabular-nums', verticalAlign: 'top' }}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                </Fragment>
              )
            })}
            <TableRow><TableCell colSpan={6} align="right" sx={{ fontWeight: 600 }}>Measured work</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}><Money value={b.measuredSubtotal} /></TableCell><TableCell /></TableRow>
            <TableRow><TableCell colSpan={6} align="right">Contingency {b.contingencyPct} %</TableCell><TableCell align="right"><Money value={b.contingency} /></TableCell><TableCell /></TableRow>
            <TableRow><TableCell colSpan={6} align="right">VAT {b.vatPct} %</TableCell><TableCell align="right"><Money value={b.vat} /></TableCell><TableCell /></TableRow>
            <TableRow><TableCell colSpan={6} align="right" sx={{ fontWeight: 700, fontSize: 16 }}>Grand total</TableCell><TableCell align="right" sx={{ fontWeight: 700, fontSize: 16 }}><Money value={b.grandTotal} /></TableCell><TableCell /></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {editing && (
        <OverrideDialog
          item={editing}
          pending={override.isPending}
          error={override.error instanceof ApiError ? override.error.message : undefined}
          onClose={() => setEditing(null)}
          onSubmit={(input) => override.mutate({ itemId: editing.id, input }, { onSuccess: () => setEditing(null) })}
        />
      )}
    </Box>
  )
}
