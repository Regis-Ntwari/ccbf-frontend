import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckIcon from '@mui/icons-material/Check'
import { estimateApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'
import { useQueryClient } from '@tanstack/react-query'
import { finalizeDraft, useWizardStore, WIZARD_STEPS } from '@/shared/stores'
import { ESTIMATE_CLASS_LABEL } from '@/shared/api/schemas'
import { useConfig } from '@/features/config/api'

import {
  StepBudget,
  StepElements,
  StepExtras,
  StepFinish,
  StepFloors,
  StepPlot,
  StepRooms,
  StepSize,
  StepWhat,
  StepWhere,
} from './steps'

const STEP_COMPONENT = {
  what: StepWhat,
  where: StepWhere,
  size: StepSize,
  floors: StepFloors,
  rooms: StepRooms,
  finish: StepFinish,
  elements: StepElements,
  extras: StepExtras,
  plot: StepPlot,
  budget: StepBudget,
}

/** Essentials for a Level 1 estimate; the rest promotes the result to Level 2. */
const ESSENTIAL = ['what', 'where', 'size', 'floors']

/** Progressive-disclosure questionnaire (Section 10). Max 3 essentials asked when prefilled. */
export function Wizard({ step }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const config = useConfig()
  const draft = useWizardStore((s) => s.draft)
  const setDraft = useWizardStore((s) => s.setDraft)
  const prefilled = useWizardStore((s) => s.prefilled)
  const [errors, setErrors] = useState({})
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState(null)

  const current = step === 'finish' ? 'budget' : step
  const index = WIZARD_STEPS.indexOf(current)
  const Component = STEP_COMPONENT[current]
  const essentialsDone = ESSENTIAL.every((s) => prefilled.includes(s) || WIZARD_STEPS.indexOf(s) < index)
  const go = (s) => void navigate({ to: '/estimate/new', search: { step: s } })
  const level = index < ESSENTIAL.length ? 1 : 2
  const classLabel = config.data?.classes.find((c) => c.level === level)?.label ?? ESTIMATE_CLASS_LABEL[level]

  const run = async (requestedClass) => {
    const { params, errors: errs } = finalizeDraft({ ...draft, requestedClass })
    if (!params) {
      setErrors(errs)
      const firstBad = Object.keys(errs)[0] ?? ''
      const target = { typology: 'what', locationId: 'where', gfa: 'size', storeys: 'floors' }[firstBad]
      if (target) go(target)
      return
    }
    setErrors({})
    setRunning(true)
    setRunError(null)
    try {
      const result = await estimateApi.run(params)
      qc.setQueryData(qk.estimate(result.id), result)
      void navigate({ to: '/estimate/$estimateId', params: { estimateId: result.id } })
    } catch (e) {
      setRunError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const next = () => {
    const { errors: errs } = finalizeDraft({ ...draft, requestedClass: 1 })
    const thisStepKey = { what: 'typology', where: 'locationId', size: 'gfa', floors: 'storeys' }[current]
    if (thisStepKey && errs?.[thisStepKey]) {
      setErrors({ [thisStepKey]: errs[thisStepKey] })
      return
    }
    setErrors({})
    const n = WIZARD_STEPS[index + 1]
    if (n) go(n)
    else void run(2)
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {t('estimate.wizardUi.stepOf', { i: index + 1, n: WIZARD_STEPS.length })}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          label={t('estimate.wizardUi.level', { n: level, label: classLabel })}
          color={level === 1 ? 'warning' : 'info'}
        />
      </Stack>
      <LinearProgress
        variant="determinate"
        value={((index + 1) / WIZARD_STEPS.length) * 100}
        sx={{ mb: 3, borderRadius: 2, height: 6 }}
      />
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h2" component="h1" sx={{ mb: 3 }}>
          {t(`wizard.${current}`)}
        </Typography>
        <Component draft={draft} setDraft={setDraft} errors={errors} />
        {runError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {runError}
          </Alert>
        )}
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} sx={{ mt: 4, gap: 1, justifyContent: 'space-between' }}>
          <Button startIcon={<ArrowBackIcon />} disabled={index === 0} onClick={() => go(WIZARD_STEPS[index - 1])}>
            {t('wizard.back')}
          </Button>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
            {essentialsDone && index < WIZARD_STEPS.length - 1 && (
              <Button variant="outlined" onClick={() => void run(1)} disabled={running} startIcon={<CheckIcon />}>
                {t('wizard.finish_btn')}
              </Button>
            )}
            <Button
              variant="contained"
              endIcon={index === WIZARD_STEPS.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
              onClick={next}
              disabled={running}
            >
              {index === WIZARD_STEPS.length - 1 ? t('wizard.finish_btn') : t('wizard.next')}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
