import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
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
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableContainer from '@mui/material/TableContainer'
import TableSortLabel from '@mui/material/TableSortLabel'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import AddIcon from '@mui/icons-material/Add'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState, ErrorState, PageSkeleton } from '@/shared/components/States'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Money } from '@/shared/components/Money'

import { formatDate } from '@/shared/lib/format'
import { useDeleteProject, useProjects } from './api'

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

export function ProjectsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const projects = useProjects()
  const del = useDeleteProject()
  const [sorting, setSorting] = useState([{ id: 'updatedAt', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [confirm, setConfirm] = useState(null)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          header: t('workspace.columns.project'),
          cell: (c) => (
            <Link to="/projects/$projectId" params={{ projectId: c.row.original.id }}>
              {c.getValue()}
            </Link>
          ),
        }),
        helper.accessor('typology', {
          header: t('workspace.columns.type'),
          cell: (c) => t(`typology.${c.getValue()}`),
        }),
        helper.accessor('locationName', { header: t('workspace.columns.location') }),
        helper.accessor('estimateClass', {
          header: t('workspace.columns.class'),
          cell: (c) => <EstimateClassBadge estimateClass={c.getValue()} />,
        }),
        helper.accessor('latestTotalMid', {
          header: t('workspace.columns.mostLikely'),
          sortFn: 'basic',
          cell: (c) => (c.getValue() == null ? '—' : <Money value={c.getValue()} compact />),
          meta: { align: 'right' },
        }),
        helper.accessor('status', {
          header: t('workspace.columns.status'),
          cell: (c) => (
            <Chip
              size="small"
              label={t(`workspace.projects.status.${c.getValue()}`, { defaultValue: c.getValue() })}
              variant="outlined"
            />
          ),
        }),
        helper.accessor('updatedAt', {
          header: t('workspace.columns.updated'),
          cell: (c) => formatDate(c.getValue(), i18n.language),
        }),
        helper.display({
          id: 'actions',
          header: '',
          cell: (c) => (
            <IconButton
              size="small"
              aria-label={t('workspace.projects.deleteAria', { name: c.row.original.name })}
              onClick={() => setConfirm(c.row.original)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          ),
        }),
      ]),
    [t, i18n.language],
  )

  const table = useTable({
    features,
    columns,
    data: projects.data?.items ?? EMPTY,
    getRowId: (r) => r.id,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
  })

  return (
    <Box>
      <PageHeader
        title={t('nav.projects')}
        actions={
          <>
            <TextField
              size="small"
              placeholder={t('common.search')}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              slotProps={{ htmlInput: { 'aria-label': t('common.search') } }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => void navigate({ to: '/estimate/new', search: { step: 'what' } })}
            >
              {t('workspace.newProject')}
            </Button>
          </>
        }
      />
      {projects.isPending && <PageSkeleton />}
      {projects.isError && <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />}
      {projects.data && projects.data.items.length === 0 && (
        <EmptyState
          title={t('workspace.projects.emptyTitle')}
          description={t('workspace.projects.emptyDescription')}
          action={
            <Button component={Link} to="/estimate/new" variant="contained">
              {t('workspace.projects.startEstimate')}
            </Button>
          }
        />
      )}
      {projects.data && projects.data.items.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableCell
                      key={h.id}
                      align={h.column.columnDef.meta?.align ?? 'left'}
                      sortDirection={h.column.getIsSorted() || false}
                    >
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
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} hover>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} align={cell.column.columnDef.meta?.align ?? 'left'}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={t('workspace.projects.deleteTitle')}
        text={t('workspace.projects.deleteText', { name: confirm?.name ?? '' })}
        confirmLabel={t('common.delete')}
        destructive
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) del.mutate(confirm.id)
          setConfirm(null)
        }}
      />
    </Box>
  )
}
