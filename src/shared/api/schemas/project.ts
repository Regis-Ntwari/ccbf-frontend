import { z } from 'zod'
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
export type Project = z.infer<typeof ProjectSchema>

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Give the project a name'),
  params: EstimateParamsSchema,
  fromEstimateId: z.string().nullable().default(null),
})
export type CreateProjectInput = z.input<typeof CreateProjectSchema>

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
export type Scenario = z.infer<typeof ScenarioSchema>
