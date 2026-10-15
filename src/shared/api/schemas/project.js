import { z } from 'zod'
import i18n from '@/shared/i18n'
import { EstimateClassSchema, TypologySchema } from './common'
import { EstimateParamsSchema } from './estimate'

export const ProjectStatusSchema = z.enum(['draft', 'active', 'archived'])

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  typology: TypologySchema,
  locationId: z.string(),
  locationName: z.string(),
  estimateClass: EstimateClassSchema,
  status: ProjectStatusSchema,
  ownerId: z.string(),
  companyId: z.string().nullable(),
  params: EstimateParamsSchema,
  latestEstimateId: z.string().nullable(),
  latestTotalMid: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CreateProjectSchema = z.object({
  name: z.string().min(2, { error: () => i18n.t('validation.projectName') }),
  params: EstimateParamsSchema,
  fromEstimateId: z.string().nullable().default(null),
})

/** A saved what-if scenario attached to a project (Feature 11). */
export const ScenarioSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  params: EstimateParamsSchema,
  estimateId: z.string(),
  totalMid: z.number(),
  createdAt: z.string(),
})

export const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum([
    'project_created',
    'project_updated',
    'scenario_added',
    'boq_transition',
    'boq_override',
    'price_decision',
    'price_submitted',
  ]),
  projectId: z.string().nullable(),
  projectName: z.string().nullable(),
  message: z.string(),
  actor: z.string(),
  at: z.string(),
})

export const DashboardSchema = z.object({
  activeProjects: z.number().int(),
  totalEstimatedValue: z.number(),
  draftEstimates: z.number().int(),
  issuedBoqs: z.number().int(),
  boqsInReview: z.number().int(),
  blockedExports: z.number().int(),
  pendingPrices: z.number().int(),
  recentProjects: z.array(ProjectSchema),
  valueByProject: z.array(z.object({ id: z.string(), name: z.string(), total: z.number() })),
  activity: z.array(ActivitySchema),
})
