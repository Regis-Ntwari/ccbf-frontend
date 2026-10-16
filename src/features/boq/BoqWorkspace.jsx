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

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import AddIcon from '@mui/icons-material/Add'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import { TraceButton } from '@/shared/components/TraceButton'
import { Money } from '@/shared/components/Money'

import { useCurrentUser } from '@/shared/stores'
import { can } from '@/shared/lib/permissions'
import { formatDate, formatNumber, unitLabel } from '@/shared/lib/format'
import { ApiError } from '@/shared/api/client'
import { FONT_MONO } from '@/shared/theme/theme'
import {
  useAddItem,
  useBoq,
  useExportBoq,
  useOverrideItem,
  useRemoveItem,
  useResetOverride,
  useSetAdjustments,
  useTransitionBoq,
} from './api'
import { OverrideDialog } from './OverrideDialog'
import { AddItemDialog } from './AddItemDialog'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  globalFilteringFeature,
})
const helper = createColumnHelper()
const EMPTY = []
const STATUS_COLOR = { draft: 'default', review: 'info', approved: 'success', primary: 'primary' }
const NEXT = {
  draft: { labelKey: 'workspace.boq.submitReview', to: 'review', approver: false },
  review: { labelKey: 'workspace.boq.approve', to: 'approved', approver: true },
  approved: { labelKey: 'workspace.boq.issue', to: 'issued', approver: true },
  issued: null,
}

const alignOf = (meta) => meta?.align ?? 'left'

/**
 * Estimation workspace: project information, work sections, a technical table of
 * activities with quantities, units, rates and totals, adjustments and the
 * versioned issue workflow.
 */
export function BoqWorkspace({ project }) {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const boq = useBoq(project.id)
  const override = useOverrideItem(project.id)
  const reset = useResetOverride(project.id)
  const transition = useTransitionBoq(project.id)
  const exportBoq = useExportBoq(project.id)
  const addItem = useAddItem(project.id)
  const removeItem = useRemoveItem(project.id)
  const setAdjustments = useSetAdjustments(project.id)
  const [sorting, setSorting] = useState([{ id: 'code', desc: false }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [section, setSection] = useState('')
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [adj, setAdj] = useState(null)
  const editable = can(user, 'edit_overrides') && boq.data?.status !== 'issued'

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('code', {
          header: t('workspace.columns.item'),
          sortFn: 'alphanumeric',
          cell: (c) => <span style={{ fontFamily: FONT_MONO }}>{c.getValue()}</span>,
        }),
        helper.accessor('description', {
          header: t('workspace.columns.activity'),
          cell: (c) => (
            <Box sx={{ minWidth: 220 }}>
              {c.getValue()}
              {c.row.original.custom && (
                <Chip
                  size="small"
                  label={t('workspace.boq.added')}
                  variant="outlined"
                  sx={{ ml: 1, height: 16, fontSize: 10 }}
                />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {c.row.original.trade}
                {c.row.original.formula ? ` · ${c.row.original.formula}` : ''}
              </Typography>
            </Box>
          ),
        }),
        helper.accessor('unit', {
          header: t('workspace.columns.unit'),
          enableSorting: false,
          cell: (c) => <span style={{ fontFamily: FONT_MONO }}>{unitLabel(t, c.getValue())}</span>,
        }),
        helper.accessor('qty', {
          header: t('workspace.columns.qty'),
          sortFn: 'basic',
          meta: { align: 'right' },
          cell: (c) => (
            <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 0.75 }}>
              <span style={{ fontFamily: FONT_MONO }}>{formatNumber(c.getValue(), i18n.language, 2)}</span>
              <Tooltip
                title={t('workspace.boq.qtySourceTip', {
                  source: t(`workspace.boq.qtySource.${c.row.original.qtySource}`, {
                    defaultValue: c.row.original.qtySource,
                  }),
                })}
              >
                <Chip
                  size="small"
                  label={c.row.original.qtySource.slice(0, 3)}
                  variant="outlined"
                  color={c.row.original.qtySource === 'manual' ? 'warning' : 'default'}
                  sx={{ height: 16, fontSize: 10, fontFamily: FONT_MONO }}
                />
              </Tooltip>
            </Stack>
          ),
        }),
        helper.accessor('wastePct', {
          header: t('workspace.columns.waste'),
          meta: { align: 'right' },
          cell: (c) => <span style={{ fontFamily: FONT_MONO }}>{c.getValue()} %</span>,
        }),
        helper.accessor('rate', {
          header: t('workspace.columns.rate'),
          sortFn: 'basic',
          meta: { align: 'right' },
          cell: (c) => {
            const p = c.row.original.rateProvenance
            const allowance = c.row.original.unit === 'sum' || c.row.original.unit === 'PC'
            const confidence = p ? t(`workspace.boq.confidence.${p.confidence}`, { defaultValue: p.confidence }) : ''
            return (
              <Stack sx={{ alignItems: 'flex-end' }}>
                <Money value={c.getValue()} />
                {p ? (
                  <Tooltip
                    title={
                      t('workspace.boq.rateTip', {
                        source: p.source,
                        date: formatDate(p.sourceDate, i18n.language),
                        confidence,
                      }) + (p.verified ? t('workspace.boq.verified') : '')
                    }
                  >
                    <Chip
                      size="small"
                      label={p.stale ? t('workspace.boq.stale') : confidence}
                      color={p.stale ? 'error' : p.confidence === 'high' ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ height: 16, fontSize: 10 }}
                    />
                  </Tooltip>
                ) : (
                  <Chip
                    size="small"
                    label={
                      c.row.original.custom
                        ? t('workspace.boq.entered')
                        : allowance
                          ? t('workspace.boq.allowance')
                          : t('workspace.boq.noPrice')
                    }
                    color={c.row.original.custom || allowance ? 'default' : 'error'}
                    variant="outlined"
                    sx={{ height: 16, fontSize: 10 }}
                  />
                )}
              </Stack>
            )
          },
        }),
        helper.accessor('amount', {
          header: t('workspace.columns.amount'),
          sortFn: 'basic',
          meta: { align: 'right' },
          cell: (c) => <Money value={c.getValue()} sx={{ fontWeight: c.row.original.override ? 600 : 400 }} />,
        }),
        helper.display({
          id: 'actions',
          header: '',
          cell: (c) => (
            <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
              <TraceButton estimateId={c.row.original.id.split(':')[0] ?? ''} figureId={c.row.original.figureId} />
              {editable && (
                <Tooltip
                  title={
                    c.row.original.override
                      ? t('workspace.boq.overrideTip', {
                          by: c.row.original.override.changedBy,
                          reason: c.row.original.override.reason,
                        })
                      : t('workspace.boq.editTip')
                  }
                >
                  <IconButton
                    size="small"
                    aria-label={t('workspace.boq.editItem')}
                    color={c.row.original.override ? 'warning' : 'default'}
                    onClick={() => setEditing(c.row.original)}
                  >
                    <EditOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
              {editable && c.row.original.override && (
                <Tooltip title={t('workspace.boq.resetTip')}>
                  <IconButton
                    size="small"
                    aria-label={t('workspace.boq.resetOverride')}
                    onClick={() => reset.mutate(c.row.original.id)}
                  >
                    <RestartAltIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
              {editable && c.row.original.custom && (
                <Tooltip title={t('workspace.boq.removeActivity')}>
                  <IconButton
                    size="small"
                    aria-label={t('workspace.boq.removeActivity')}
                    onClick={() => removeItem.mutate(c.row.original.id)}
                  >
                    <DeleteOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          ),
        }),
      ]),
    [t, i18n.language, editable, reset, removeItem],
  )

  const data = useMemo(
    () => (boq.data ? boq.data.bills.flatMap((b) => b.items).filter((i) => !section || i.billCode === section) : EMPTY),
    [boq.data, section],
  )
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
  const b = boq.data
  const next = NEXT[b.status]
  const canAdvance = next && (!next.approver || can(user, 'approve_boq'))
  const blocked = b.exportBlockedReasons.length > 0
  const rows = table.getRowModel().rows
  const grouped = sorting[0]?.id === 'code' && !section
  const billName = (code) => b.bills.find((x) => x.code === code)?.name ?? code
  const adjValues = adj ?? {
    overheadPct: String(b.overheadPct),
    contingencyPct: String(b.contingencyPct),
    vatPct: String(b.vatPct),
  }
  const adjDirty =
    adj !== null &&
    (Number(adj.overheadPct) !== b.overheadPct ||
      Number(adj.contingencyPct) !== b.contingencyPct ||
      Number(adj.vatPct) !== b.vatPct)

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '260px 1fr' }, gap: 3, alignItems: 'start' }}>
      {/* Left rail: project information + work sections */}
      <Stack spacing={2} sx={{ minWidth: 0, position: { xl: 'sticky' }, top: { xl: 68 } }}>
        <Box
          sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', display: { xs: 'none', xl: 'block' } }}
        >
          <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1.5, display: 'block' }}>
            {t('workspace.boq.projectInfo')}
          </Typography>
          <Table size="small" sx={{ '& td': { py: 0.6 } }}>
            <TableBody>
              {[
                [t('workspace.boq.reference'), project.id.replace('prj_', 'PRJ-').toUpperCase()],
                [t('workspace.columns.type'), t(`typology.${project.typology}`)],
                [t('workspace.columns.location'), project.locationName],
                [t('workspace.boq.floorArea'), `${project.params.gfa} m²`],
                [t('workspace.boq.floorsLabel'), String(project.params.storeys)],
                [t('workspace.boq.finishLabel'), t(`quality.${project.params.quality}`)],
                [t('workspace.columns.class'), t('workspace.level', { n: project.estimateClass })],
              ].map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell sx={{ color: 'text.secondary', borderBottomStyle: 'dashed' }}>{k}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT_MONO, borderBottomStyle: 'dashed' }}>
                    {v}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1.5, display: 'block' }}>
            {t('workspace.boq.workSections')}
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: 'none',
              m: 0,
              p: 0,
              display: 'flex',
              flexDirection: { xs: 'row', xl: 'column' },
              overflowX: 'auto',
              '& > li': { flexShrink: 0, minWidth: { xs: 220, xl: 0 } },
            }}
          >
            {[{ code: '', name: t('workspace.boq.allSections'), subtotal: b.measuredSubtotal }, ...b.bills].map(
              (bill) => {
                const on = section === bill.code
                return (
                  <Box key={bill.code || 'all'} component="li">
                    <Box
                      component="button"
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSection(bill.code)}
                      sx={{
                        font: 'inherit',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr auto',
                        gap: 1,
                        alignItems: 'center',
                        px: 2,
                        py: 0.75,
                        border: 0,
                        borderLeft: '2px solid',
                        borderColor: on ? 'secondary.main' : 'transparent',
                        bgcolor: on ? 'action.selected' : 'transparent',
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: 'text.secondary' }}>
                        {bill.code || '—'}
                      </Typography>
                      <Typography variant="body2" noWrap sx={{ fontWeight: on ? 600 : 400 }}>
                        {bill.name}
                      </Typography>
                      <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: 'text.secondary' }}>
                        {formatNumber(bill.subtotal / 1e6, i18n.language, 1)}M
                      </Typography>
                    </Box>
                  </Box>
                )
              },
            )}
          </Box>
        </Box>
      </Stack>

      {/* Main: toolbar, table, adjustments */}
      <Box sx={{ minWidth: 0 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ gap: 1, mb: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={`v${b.version} · ${t(`workspace.boq.status.${b.status}`, { defaultValue: b.status })}`}
              color={STATUS_COLOR[b.status] ?? 'default'}
              sx={{ fontFamily: FONT_MONO }}
            />
            <Chip label={b.classLabel} variant="outlined" color="warning" size="small" />
            <Typography variant="caption" color="text.secondary">
              {t('workspace.boq.updatedBy', { date: formatDate(b.updatedAt, i18n.language), by: b.updatedBy })}
            </Typography>
          </Stack>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {editable && (
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
                {t('workspace.boq.addActivity')}
              </Button>
            )}
            {b.status !== 'draft' && can(user, 'edit_overrides') && (
              <Button size="small" onClick={() => transition.mutate('draft')}>
                {b.status === 'issued' ? t('workspace.boq.newRevision') : t('workspace.boq.backToDraft')}
              </Button>
            )}
            {next && (
              <Button
                size="small"
                variant="contained"
                disabled={!canAdvance || transition.isPending}
                onClick={() => transition.mutate(next.to)}
              >
                {t(next.labelKey)}
              </Button>
            )}
            <Tooltip title={blocked ? t('workspace.boq.exportBlockedTip') : t('workspace.boq.export')}>
              <span>
                <ButtonGroup
                  size="small"
                  variant="outlined"
                  disabled={blocked || exportBoq.isPending || !can(user, 'export_boq')}
                >
                  <Button startIcon={<DownloadIcon />} onClick={() => exportBoq.mutate('xlsx')}>
                    Excel
                  </Button>
                  <Button onClick={() => exportBoq.mutate('pdf')}>PDF</Button>
                  <Button onClick={() => exportBoq.mutate('csv')}>CSV</Button>
                </ButtonGroup>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
        {blocked && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('workspace.boq.blockedAlert')}
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {b.exportBlockedReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </Box>
          </Alert>
        )}
        {transition.isError && <ErrorState error={transition.error} />}
        {exportBoq.isError && <ErrorState error={exportBoq.error} />}
        {exportBoq.data?.note && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {exportBoq.data.note}
          </Alert>
        )}

        <Stack direction="row" sx={{ gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('workspace.boq.filterPlaceholder')}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ htmlInput: { 'aria-label': t('workspace.boq.filterAria') } }}
          />
          <Typography variant="caption" color="text.secondary">
            {section
              ? t('workspace.boq.activityCountInSection', { n: rows.length, section })
              : t('workspace.boq.activityCount', { n: rows.length })}
          </Typography>
        </Stack>

        <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 880 }}>
            <TableHead>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableCell key={h.id} align={alignOf(h.column.columnDef.meta)}>
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <TableSortLabel
                          active={Boolean(h.column.getIsSorted())}
                          direction={h.column.getIsSorted() || 'asc'}
                          onClick={h.column.getToggleSortingHandler()}
                        >
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
                      <TableRow sx={{ bgcolor: 'surface.tertiary' }}>
                        <TableCell colSpan={8} sx={{ fontWeight: 600, py: 1 }}>
                          <span
                            style={{
                              fontFamily: FONT_MONO,
                              marginRight: 8,
                              color: 'var(--mui-palette-text-secondary)',
                            }}
                          >
                            {row.original.billCode}
                          </span>
                          {billName(row.original.billCode)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow hover sx={{ bgcolor: row.original.override ? 'rgba(154,107,31,0.06)' : undefined }}>
                      {row.getAllCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          align={alignOf(cell.column.columnDef.meta)}
                          sx={{ fontVariantNumeric: 'tabular-nums', verticalAlign: 'top' }}
                        >
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 360px' }, gap: 2 }}>
          <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              {t('workspace.boq.adjustments')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('workspace.boq.adjustmentsHint')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              {['overheadPct', 'contingencyPct', 'vatPct'].map((k) => (
                <TextField
                  key={k}
                  type="number"
                  label={
                    k === 'overheadPct'
                      ? t('workspace.boq.overheads')
                      : k === 'contingencyPct'
                        ? t('workspace.boq.contingency')
                        : t('workspace.boq.vat')
                  }
                  value={adjValues[k]}
                  disabled={!editable}
                  onChange={(e) => setAdj({ ...adjValues, [k]: e.target.value })}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      sx: { fontFamily: FONT_MONO },
                    },
                    htmlInput: { min: 0, max: 50, step: 0.5 },
                  }}
                  fullWidth
                />
              ))}
            </Stack>
            {editable && (
              <Stack direction="row" sx={{ gap: 1, mt: 1.5 }}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!adjDirty || setAdjustments.isPending}
                  onClick={() =>
                    adj &&
                    setAdjustments.mutate(
                      {
                        overheadPct: Number(adj.overheadPct),
                        contingencyPct: Number(adj.contingencyPct),
                        vatPct: Number(adj.vatPct),
                      },
                      { onSuccess: () => setAdj(null) },
                    )
                  }
                >
                  {t('workspace.boq.apply')}
                </Button>
                <Button size="small" disabled={!adjDirty} onClick={() => setAdj(null)}>
                  {t('workspace.boq.reset')}
                </Button>
              </Stack>
            )}
            {setAdjustments.isError && <ErrorState error={setAdjustments.error} />}
          </Box>
          <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'surface.secondary', p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              {t('workspace.boq.summary')}
            </Typography>
            <Table size="small" sx={{ '& td': { px: 0, py: 0.6, borderBottomStyle: 'dashed' } }}>
              <TableBody>
                <TableRow>
                  <TableCell>{t('workspace.boq.measuredWork')}</TableCell>
                  <TableCell align="right">
                    <Money value={b.measuredSubtotal} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('workspace.boq.overheadsPct', { pct: b.overheadPct })}</TableCell>
                  <TableCell align="right">
                    <Money value={b.overhead} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('workspace.boq.contingencyPct', { pct: b.contingencyPct })}</TableCell>
                  <TableCell align="right">
                    <Money value={b.contingency} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('workspace.boq.vatPct', { pct: b.vatPct })}</TableCell>
                  <TableCell align="right">
                    <Money value={b.vat} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, borderBottom: 0, pt: 1.5 }}>
                    {t('workspace.columns.grandTotal')}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: 0, pt: 1.5 }}>
                    <Money value={b.grandTotal} sx={{ fontWeight: 600, fontSize: 16 }} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      {editing && (
        <OverrideDialog
          item={editing}
          pending={override.isPending}
          error={override.error instanceof ApiError ? override.error.message : undefined}
          onClose={() => setEditing(null)}
          onSubmit={(input) => override.mutate({ itemId: editing.id, input }, { onSuccess: () => setEditing(null) })}
        />
      )}
      {adding && (
        <AddItemDialog
          bills={b.bills}
          defaultBill={section || b.bills[0]?.code || '13'}
          pending={addItem.isPending}
          error={addItem.error instanceof ApiError ? addItem.error.message : undefined}
          onClose={() => setAdding(false)}
          onSubmit={(input) => addItem.mutate(input, { onSuccess: () => setAdding(false) })}
        />
      )}
    </Box>
  )
}
