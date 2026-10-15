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
import type { SortingState } from '@tanstack/react-table'
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
import type { Project } from '@/shared/api/schemas'
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
const helper = createColumnHelper<typeof features, Project>()
const EMPTY: Project[] = []

export function ProjectsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const projects = useProjects()
  const del = useDeleteProject()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [confirm, setConfirm] = useState<Project | null>(null)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', { header: 'Project', cell: (c) => <Link to="/projects/$projectId" params={{ projectId: c.row.original.id }}>{c.getValue()}</Link> }),
        helper.accessor('typology', { header: 'Type', cell: (c) => t(`typology.${c.getValue()}`) }),
        helper.accessor('locationName', { header: 'Location' }),
        helper.accessor('estimateClass', { header: 'Class', cell: (c) => <EstimateClassBadge estimateClass={c.getValue()} /> }),
        helper.accessor('latestTotalMid', { header: 'Most likely', sortFn: 'basic', cell: (c) => (c.getValue() == null ? '—' : <Money value={c.getValue()!} compact />), meta: { align: 'right' } }),
        helper.accessor('status', { header: 'Status', cell: (c) => <Chip size="small" label={c.getValue()} variant="outlined" /> }),
        helper.accessor('updatedAt', { header: 'Updated', cell: (c) => formatDate(c.getValue(), i18n.language) }),
        helper.display({
          id: 'actions',
          header: '',
          cell: (c) => (
            <IconButton size="small" aria-label={`Delete ${c.row.original.name}`} onClick={() => setConfirm(c.row.original)}>
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
            <TextField size="small" placeholder={t('common.search')} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} slotProps={{ htmlInput: { 'aria-label': t('common.search') } }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => void navigate({ to: '/estimate/new', search: { step: 'what' } })}>New project</Button>
          </>
        }
      />
      {projects.isPending && <PageSkeleton />}
      {projects.isError && <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />}
      {projects.data && projects.data.items.length === 0 && (
        <EmptyState title="No projects yet" description="Run an estimate and save it as a project." action={<Button component={Link} to="/estimate/new" variant="contained">Start an estimate</Button>} />
      )}
      {projects.data && projects.data.items.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableCell key={h.id} align={(h.column.columnDef.meta as { align?: 'right' } | undefined)?.align ?? 'left'} sortDirection={h.column.getIsSorted() || false}>
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
                    <TableCell key={cell.id} align={(cell.column.columnDef.meta as { align?: 'right' } | undefined)?.align ?? 'left'}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ConfirmDialog open={Boolean(confirm)} title="Delete project?" text={`"${confirm?.name}" and its scenarios will be removed.`} confirmLabel="Delete" destructive onClose={() => setConfirm(null)} onConfirm={() => { if (confirm) del.mutate(confirm.id); setConfirm(null) }} />
    </Box>
  )
}
