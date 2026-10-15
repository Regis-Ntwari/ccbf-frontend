import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import { LinkButton } from '@/shared/components/LinkButton'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState, ErrorState, PageSkeleton } from '@/shared/components/States'
import { Money } from '@/shared/components/Money'
import { formatDate } from '@/shared/lib/format'
import { FONT_MONO } from '@/shared/theme/theme'
import { useBoqs } from './api'

/** Index of every project's Bill of Quantities with workflow status. */
export function BoqIndexPage() {
  const { t, i18n } = useTranslation()
  const boqs = useBoqs()
  if (boqs.isPending) return <PageSkeleton />
  if (boqs.isError) return <ErrorState error={boqs.error} onRetry={() => void boqs.refetch()} />
  return (
    <Box>
      <PageHeader eyebrow={t('workspace.boq.eyebrow')} title={t('titles.boq')} subtitle={t('workspace.boq.subtitle')} />
      {boqs.data.length === 0 ? (
        <EmptyState
          title={t('workspace.boq.emptyTitle')}
          description={t('workspace.boq.emptyDescription')}
          action={
            <LinkButton to="/estimate/new" search={{ step: 'what' }} variant="contained">
              {t('nav.estimate')}
            </LinkButton>
          }
        />
      ) : (
        <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('workspace.columns.project')}</TableCell>
                <TableCell>{t('workspace.columns.version')}</TableCell>
                <TableCell>{t('workspace.columns.status')}</TableCell>
                <TableCell align="right">{t('workspace.columns.items')}</TableCell>
                <TableCell align="right">{t('workspace.columns.grandTotal')}</TableCell>
                <TableCell>{t('workspace.columns.export')}</TableCell>
                <TableCell align="right">{t('workspace.columns.updated')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {boqs.data.map((b) => (
                <TableRow key={b.projectId} hover>
                  <TableCell>
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: b.projectId }}
                      search={{ tab: 'boq' }}
                      style={{ color: 'inherit', fontWeight: 500 }}
                    >
                      {b.projectName}
                    </Link>
                    <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: 12 }}>
                      {b.locationName}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_MONO }}>v{b.version}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={t(`workspace.boq.status.${b.status}`, { defaultValue: b.status })}
                      color={
                        b.status === 'issued'
                          ? 'primary'
                          : b.status === 'approved'
                            ? 'success'
                            : b.status === 'review'
                              ? 'info'
                              : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                    {b.itemCount}
                  </TableCell>
                  <TableCell align="right">
                    <Money value={b.grandTotal} />
                  </TableCell>
                  <TableCell>
                    {b.blocked ? (
                      <Chip size="small" label={t('workspace.boq.exportBlocked')} color="error" variant="outlined" />
                    ) : (
                      <Chip size="small" label={t('workspace.boq.exportReady')} color="success" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontFamily: FONT_MONO, color: 'text.secondary', whiteSpace: 'nowrap' }}
                  >
                    {formatDate(b.updatedAt, i18n.language)}
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
