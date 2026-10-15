import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import { BarChart } from '@mui/x-charts/BarChart'
import AddIcon from '@mui/icons-material/Add'
import { PageHeader } from '@/shared/components/PageHeader'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { Money } from '@/shared/components/Money'
import { useChartPalette } from '@/shared/components/QualityChip'
import { useCurrentUser } from '@/shared/stores'
import { can } from '@/shared/lib/permissions'
import { formatDate, formatMoney } from '@/shared/lib/format'
import { FONT_MONO } from '@/shared/theme/theme'
import { useDashboard } from './api'

function Kpi({ label, value, hint }) {
  return (
    <Box
      sx={{
        py: 2,
        px: 2.5,
        borderRight: { md: 1 },
        borderBottom: { xs: 1, md: 0 },
        borderColor: 'divider',
        '&:last-of-type': { borderRight: 0, borderBottom: 0 },
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: FONT_MONO,
          fontSize: 26,
          fontWeight: 500,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  )
}

/** Operational overview: activity, cost visibility and quick access to ongoing work. */
export function OverviewPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const dash = useDashboard()
  const palette = useChartPalette()
  const pro = can(user, 'view_rates')

  if (dash.isPending) return <PageSkeleton />
  if (dash.isError) return <ErrorState error={dash.error} onRetry={() => void dash.refetch()} />
  const d = dash.data
  const count = (key, n) => t(`workspace.dashboard.${key}_${n === 1 ? 'one' : 'other'}`, { n })
  const tasks = []
  if (d.boqsInReview) tasks.push({ text: count('taskBoqReview', d.boqsInReview), to: '/boq' })
  if (d.blockedExports) tasks.push({ text: count('taskBlocked', d.blockedExports), to: '/materials' })
  if (d.pendingPrices) tasks.push({ text: count('taskPrices', d.pendingPrices), to: '/admin/submissions' })
  if (d.draftEstimates) tasks.push({ text: count('taskDrafts', d.draftEstimates), to: '/projects' })

  return (
    <Box>
      <PageHeader
        eyebrow={`${user?.companyName ?? t('workspace.dashboard.personalWorkspace')} · ${formatDate(new Date().toISOString(), i18n.language)}`}
        title={t('workspace.dashboard.greeting', { name: user?.name.split(' ')[0] ?? '' })}
        subtitle={t('workspace.dashboard.subtitle')}
        actions={
          <>
            <Button variant="outlined" onClick={() => void navigate({ to: '/estimate/new', search: { step: 'what' } })}>
              {t('nav.estimate')}
            </Button>
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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          mb: 3,
        }}
      >
        <Kpi label={t('workspace.dashboard.activeProjects')} value={String(d.activeProjects)} />
        <Kpi
          label={t('workspace.dashboard.totalValue')}
          value={formatMoney(d.totalEstimatedValue, 'RWF', i18n.language, { compact: true })}
          hint={t('workspace.dashboard.totalValueHint')}
        />
        <Kpi
          label={t('workspace.dashboard.draftEstimates')}
          value={String(d.draftEstimates)}
          hint={t('workspace.dashboard.draftHint')}
        />
        <Kpi
          label={pro ? t('workspace.dashboard.issuedBoqs') : t('workspace.dashboard.savedScenarios')}
          value={String(pro ? d.issuedBoqs : d.activity.filter((a) => a.type === 'scenario_added').length)}
          hint={pro ? t('workspace.dashboard.inReview', { n: d.boqsInReview }) : undefined}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 2.5,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h5">{t('workspace.dashboard.recentProjects')}</Typography>
              <Button component={Link} to="/projects" size="small">
                {t('workspace.dashboard.allProjects')}
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('workspace.columns.project')}</TableCell>
                  <TableCell>{t('workspace.columns.class')}</TableCell>
                  <TableCell align="right">{t('workspace.columns.mostLikely')}</TableCell>
                  <TableCell align="right">{t('workspace.columns.updated')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.recentProjects.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.id }}
                        style={{ color: 'inherit', fontWeight: 500 }}
                      >
                        {p.name}
                      </Link>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t(`typology.${p.typology}`)} · {p.locationName} ·{' '}
                        <Box component="span" sx={{ fontFamily: FONT_MONO }}>
                          {p.params.gfa} m²
                        </Box>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <EstimateClassBadge estimateClass={p.estimateClass} />
                    </TableCell>
                    <TableCell align="right">
                      {p.latestTotalMid != null ? <Money value={p.latestTotalMid} compact /> : '—'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontFamily: FONT_MONO, color: 'text.secondary', whiteSpace: 'nowrap' }}
                    >
                      {formatDate(p.updatedAt, i18n.language)}
                    </TableCell>
                  </TableRow>
                ))}
                {d.recentProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                      {t('workspace.dashboard.noProjects')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          {d.valueByProject.length > 0 && (
            <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 2.5 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {t('workspace.dashboard.valueByProject')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('workspace.dashboard.valueByProjectHint')}
              </Typography>
              <BarChart
                layout="horizontal"
                height={Math.max(160, d.valueByProject.length * 36 + 40)}
                hideLegend
                borderRadius={2}
                yAxis={[
                  { scaleType: 'band', data: d.valueByProject.map((v) => v.name), width: 180, categoryGapRatio: 0.4 },
                ]}
                xAxis={[{ valueFormatter: (v) => formatMoney(v, 'RWF', i18n.language, { compact: true }) }]}
                series={[
                  {
                    data: d.valueByProject.map((v) => v.total),
                    color: palette.series[0],
                    label: t('workspace.dashboard.valueSeries'),
                    valueFormatter: (v) => (v == null ? '' : formatMoney(v, 'RWF', i18n.language)),
                  },
                ]}
                grid={{ vertical: true }}
                margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                sx={{
                  '& .MuiChartsGrid-line': { stroke: palette.grid },
                  '& .MuiChartsAxis-tickLabel': { fill: palette.text, fontFamily: FONT_MONO, fontSize: 11 },
                }}
              />
            </Box>
          )}
        </Stack>

        <Stack spacing={3}>
          <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h5" sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              {t('workspace.dashboard.outstanding')}
            </Typography>
            {tasks.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2.5 }}>
                {t('workspace.dashboard.nothingOutstanding')}
              </Typography>
            ) : (
              tasks.map((task) => (
                <Box
                  key={task.text}
                  component={Link}
                  to={task.to}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2.5,
                    py: 1.25,
                    borderBottom: 1,
                    borderColor: 'divider',
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:last-of-type': { borderBottom: 0 },
                  }}
                >
                  <Typography variant="body2">{task.text}</Typography>
                  <Chip size="small" label={t('workspace.dashboard.open')} variant="outlined" />
                </Box>
              ))
            )}
          </Box>
          <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h5" sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              {t('workspace.dashboard.recentActivity')}
            </Typography>
            {d.activity.map((a) => (
              <Box
                key={a.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr',
                  gap: 1.5,
                  px: 2.5,
                  py: 1.25,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-of-type': { borderBottom: 0 },
                }}
              >
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: 'text.secondary', pt: 0.25 }}>
                  {formatDate(a.at, i18n.language).replace(/, \d{4}$/, '')}
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2">{a.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.actor}
                    {a.projectName ? ` · ` : ''}
                    {a.projectId && a.projectName && (
                      <Link to="/projects/$projectId" params={{ projectId: a.projectId }} style={{ color: 'inherit' }}>
                        {a.projectName}
                      </Link>
                    )}
                  </Typography>
                </Box>
              </Box>
            ))}
            {d.activity.length === 0 && (
              <Typography color="text.secondary" sx={{ p: 2.5 }}>
                {t('workspace.dashboard.noActivity')}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
