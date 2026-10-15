import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Wizard } from '@/features/estimate/wizard/Wizard'
import { WIZARD_STEPS } from '@/shared/stores'
import { locationsQuery } from '@/features/estimate/api'

const searchSchema = z.object({
  step: z.enum([...WIZARD_STEPS, 'finish']).default('what').catch('what'),
})

export const Route = createFileRoute('/estimate/new')({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: WizardRoute,
})

function WizardRoute() {
  const { step } = Route.useSearch()
  return <Wizard step={step} />
}
