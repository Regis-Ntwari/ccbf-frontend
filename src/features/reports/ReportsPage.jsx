import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { LinkButton } from '@/shared/components/LinkButton'
import Stack from '@mui/material/Stack'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState, ErrorState, PageSkeleton } from '@/shared/components/States'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { Money } from '@/shared/components/Money'
import { useProjects } from '@/features/projects/api'
import { useCurrentUser } from '@/shared/stores'
import { can } from '@/shared/lib/permissions'

/** Report centre: one row per project, client and QS report types (Section 13). */
export function ReportsPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const projects = useProjects()
  if (projects.isPending) return <PageSkeleton />
  if (projects.isError) return <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />
  const pro = can(user, 'view_rates')
  return (
    <Box>
      <PageHeader
        eyebrow={t('workspace.reports.eyebrow')}
        title={t('titles.reports')}
        subtitle={t('workspace.reports.subtitle')}
      />
      {projects.data.items.length === 0 ? (
        <EmptyState title={t('workspace.reports.emptyTitle')} />
      ) : (
        <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('workspace.columns.project')}</TableCell>
                <TableCell>{t('workspace.columns.class')}</TableCell>
                <TableCell align="right">{t('workspace.columns.mostLikely')}</TableCell>
                <TableCell>{t('workspace.columns.reports')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.data.items.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <strong>{p.name}</strong>
                    <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: 12 }}>
                      {t(`typology.${p.typology}`)} · {p.locationName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <EstimateClassBadge estimateClass={p.estimateClass} />
                  </TableCell>
                  <TableCell align="right">
                    {p.latestTotalMid != null ? <Money value={p.latestTotalMid} compact /> : '—'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <LinkButton
                        size="small"
                        variant="outlined"
                        to="/reports/$projectId"
                        params={{ projectId: p.id }}
                        search={{ type: 'client' }}
                      >
                        {t('workspace.reports.clientReport')}
                      </LinkButton>
                      {pro && (
                        <LinkButton
                          size="small"
                          variant="outlined"
                          to="/reports/$projectId"
                          params={{ projectId: p.id }}
                          search={{ type: 'qs' }}
                        >
                          {t('workspace.reports.qsReport')}
                        </LinkButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  )
}
