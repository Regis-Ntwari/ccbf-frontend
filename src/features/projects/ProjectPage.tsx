import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { PageHeader } from '@/shared/components/PageHeader'
import { EstimateClassBadge } from '@/shared/components/EstimateClassBadge'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import { Money } from '@/shared/components/Money'
import { QualityChip } from '@/shared/components/QualityChip'
import { ResultView } from '@/features/estimate/ResultView'
import { ParamsQuickForm } from '@/features/estimate/ParamsQuickForm'
import { estimateQuery } from '@/features/estimate/api'
import { BoqTable } from '@/features/boq/BoqTable'
import { useCurrentUser, useScenarioStore, useUiStore } from '@/shared/stores'
import { can } from '@/shared/lib/permissions'
import type { EstimateParams, Project } from '@/shared/api/schemas'
import { EstimateParamsSchema } from '@/shared/api/schemas'
import { useAddScenario, useRemoveScenario, useScenarios, useUpdateProject } from './api'

type TabKey = 'overview' | 'scenarios' | 'boq'

/** J5/J6: project detail with client overview, what-if scenarios and the professional BOQ. */
export function ProjectPage({ project, tab, onTabChange }: { project: Project; tab: TabKey; onTabChange: (t: TabKey) => void }) {
  const { t } = useTranslation()
  const mode = useUiStore((s) => s.mode)
  const user = useCurrentUser()
  const update = useUpdateProject(project.id)
  const estimate = useQuery({ ...estimateQuery(project.latestEstimateId ?? ''), enabled: Boolean(project.latestEstimateId) })
  const professional = mode !== 'client' && can(user, 'view_rates')

  return (
    <Box>
      <PageHeader
        title={project.name}
        subtitle={`${t(`typology.${project.typology}`)} · ${project.locationName} · ${project.params.gfa} m² · ${project.params.storeys} floor(s)`}
        chips={<EstimateClassBadge estimateClass={project.estimateClass} />}
        actions={
          project.estimateClass < 2 ? (
            <Button variant="outlined" onClick={() => update.mutate({ params: { ...project.params, requestedClass: 2 } })}>Promote to Level 2</Button>
          ) : null
        }
      />
      <Tabs value={tab} onChange={(_, v: TabKey) => onTabChange(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="overview" label="Overview" />
        <Tab value="scenarios" label="Scenarios" />
        {professional && <Tab value="boq" label="BOQ" />}
      </Tabs>

      {tab === 'overview' && (
        <>
          {estimate.isPending && <PageSkeleton />}
          {estimate.isError && <ErrorState error={estimate.error} onRetry={() => void estimate.refetch()} />}
          {estimate.data && (
            <ResultView estimate={estimate.data} projectId={project.id} onParamsChange={(params) => update.mutate({ params })} />
          )}
        </>
      )}
      {tab === 'scenarios' && <ScenariosTab project={project} />}
      {tab === 'boq' && professional && <BoqTable projectId={project.id} />}
      {tab === 'boq' && !professional && <Alert severity="info">Switch to Professional mode to open the BOQ.</Alert>}
    </Box>
  )
}

function ScenariosTab({ project }: { project: Project }) {
  const { t } = useTranslation()
  const scenarios = useScenarios(project.id)
  const add = useAddScenario(project.id)
  const remove = useRemoveScenario(project.id)
  const addCompare = useScenarioStore((s) => s.add)
  const [name, setName] = useState('')
  const [draft, setDraft] = useState<Partial<EstimateParams>>(project.params)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = () => {
    const p = EstimateParamsSchema.safeParse(draft)
    if (!p.success) {
      const errs: Record<string, string> = {}
      for (const i of p.error.issues) errs[i.path.join('.')] = i.message
      return setErrors(errs)
    }
    setErrors({})
    add.mutate({ name: name || `Scenario ${(scenarios.data?.length ?? 0) + 1}`, params: p.data }, { onSuccess: () => setName('') })
  }

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>New what-if scenario</Typography>
          <ParamsQuickForm value={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} errors={errors} />
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, mt: 2 }}>
            <TextField label="Scenario name" value={name} onChange={(e) => setName(e.target.value)} sx={{ minWidth: 240 }} />
            <Button variant="contained" onClick={save} disabled={add.isPending}>Save scenario</Button>
          </Stack>
        </CardContent>
      </Card>
      {scenarios.isError && <ErrorState error={scenarios.error} />}
      {(scenarios.data ?? []).map((s) => (
        <Card key={s.id} variant="outlined">
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="h6">{s.name}</Typography>
              <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                <Chip size="small" label={t(`typology.${s.params.typology}`)} />
                <Chip size="small" label={`${s.params.gfa} m²`} />
                <Chip size="small" label={`${s.params.storeys} floor(s)`} />
                <QualityChip quality={s.params.quality} />
              </Stack>
            </Box>
            <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}><Money value={s.totalMid} compact /></Typography>
            <Typography variant="body2" color={s.totalMid > (project.latestTotalMid ?? 0) ? 'error.main' : 'success.main'}>
              {project.latestTotalMid ? `${s.totalMid > project.latestTotalMid ? '+' : ''}${(((s.totalMid - project.latestTotalMid) / project.latestTotalMid) * 100).toFixed(1)} % vs base` : ''}
            </Typography>
            <IconButton aria-label="Add to compare" onClick={() => addCompare({ estimateId: s.estimateId, label: s.name, params: s.params, totalMid: s.totalMid })}><CompareArrowsIcon /></IconButton>
            <IconButton aria-label="Delete scenario" onClick={() => remove.mutate(s.id)}><DeleteOutlineIcon /></IconButton>
          </CardContent>
        </Card>
      ))}
      {scenarios.data && scenarios.data.length === 0 && <Typography color="text.secondary">No scenarios yet. Change a few inputs above and save to compare live with the client.</Typography>}
    </Stack>
  )
}
