/** Typed endpoint functions. Hooks in features/* wrap these with TanStack Query. */
import { z } from 'zod'
import { api } from './client'
import {
  BoqSchema,
  CostToCompleteResultSchema,
  EstimateResultSchema,
  LocationSchema,
  PaginatedSchema,
  ParseIntentResultSchema,
  PriceRecordSchema,
  ProjectSchema,
  ReverseBudgetResultSchema,
  ScenarioSchema,
  SessionSchema,
  StageReachResultSchema,
  TraceNodeSchema,
  UserSchema,
} from './schemas'
import type {
  BoqOverrideInput,
  BoqStatus,
  CostToCompleteRequest,
  CreateProjectInput,
  EstimateParams,
  PriceDecision,
  PriceSubmissionInput,
  ReverseBudgetRequest,
  StageReachRequest,
  VerifyOtpInput,
} from './schemas'

const OkSchema = z.object({ ok: z.boolean() })

export const authApi = {
  requestOtp: (identifier: string) =>
    api({ method: 'POST', path: '/auth/otp/request', body: { identifier }, schema: z.object({ sent: z.boolean(), hint: z.string().optional() }) }),
  verifyOtp: (input: VerifyOtpInput) => api({ method: 'POST', path: '/auth/otp/verify', body: input, schema: SessionSchema }),
  me: () => api({ path: '/auth/me', schema: UserSchema }),
  logout: () => api({ method: 'POST', path: '/auth/logout', schema: OkSchema }),
}

export const referenceApi = {
  locations: () => api({ path: '/locations', schema: z.array(LocationSchema) }),
}

export const estimateApi = {
  run: (params: EstimateParams, projectId?: string) =>
    api({ method: 'POST', path: `/estimates${projectId ? `?projectId=${projectId}` : ''}`, body: params, schema: EstimateResultSchema }),
  get: (id: string) => api({ path: `/estimates/${id}`, schema: EstimateResultSchema }),
  trace: (id: string, figureId: string) =>
    api({ path: `/estimates/${id}/trace/${encodeURIComponent(figureId)}`, schema: TraceNodeSchema }),
  parse: (text: string) => api({ method: 'POST', path: '/estimates/parse', body: { text }, schema: ParseIntentResultSchema }),
  reverse: (req: ReverseBudgetRequest) => api({ method: 'POST', path: '/estimates/reverse', body: req, schema: ReverseBudgetResultSchema }),
  stageReach: (req: StageReachRequest) => api({ method: 'POST', path: '/estimates/stage-reach', body: req, schema: StageReachResultSchema }),
  costToComplete: (req: CostToCompleteRequest) =>
    api({ method: 'POST', path: '/estimates/cost-to-complete', body: req, schema: CostToCompleteResultSchema }),
}

export const projectApi = {
  list: (q?: string) => api({ path: `/projects${q ? `?q=${encodeURIComponent(q)}` : ''}`, schema: PaginatedSchema(ProjectSchema) }),
  get: (id: string) => api({ path: `/projects/${id}`, schema: ProjectSchema }),
  create: (input: CreateProjectInput) => api({ method: 'POST', path: '/projects', body: input, schema: ProjectSchema }),
  update: (id: string, patch: { name?: string; params?: EstimateParams; status?: 'draft' | 'active' | 'archived' }) =>
    api({ method: 'PATCH', path: `/projects/${id}`, body: patch, schema: ProjectSchema }),
  remove: (id: string) => api({ method: 'DELETE', path: `/projects/${id}`, schema: OkSchema }),
  scenarios: (id: string) => api({ path: `/projects/${id}/scenarios`, schema: z.array(ScenarioSchema) }),
  addScenario: (id: string, name: string, params: EstimateParams) =>
    api({ method: 'POST', path: `/projects/${id}/scenarios`, body: { name, params }, schema: ScenarioSchema }),
  removeScenario: (id: string, sid: string) => api({ method: 'DELETE', path: `/projects/${id}/scenarios/${sid}`, schema: OkSchema }),
}

export const ExportResultSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  content: z.string(),
  note: z.string().nullable(),
})

export const boqApi = {
  get: (projectId: string) => api({ path: `/projects/${projectId}/boq`, schema: BoqSchema }),
  override: (projectId: string, itemId: string, input: BoqOverrideInput) =>
    api({ method: 'PUT', path: `/projects/${projectId}/boq/items/${encodeURIComponent(itemId)}/override`, body: input, schema: BoqSchema }),
  resetOverride: (projectId: string, itemId: string) =>
    api({ method: 'DELETE', path: `/projects/${projectId}/boq/items/${encodeURIComponent(itemId)}/override`, schema: BoqSchema }),
  transition: (projectId: string, status: BoqStatus) =>
    api({ method: 'POST', path: `/projects/${projectId}/boq/transition`, body: { status }, schema: BoqSchema }),
  export: (projectId: string, format: 'csv' | 'xlsx' | 'pdf') =>
    api({ method: 'POST', path: `/projects/${projectId}/boq/export`, body: { format }, schema: ExportResultSchema }),
}

export const catalogueApi = {
  prices: (filters: { status?: string; category?: string; q?: string }) => {
    const qs = new URLSearchParams()
    if (filters.status) qs.set('status', filters.status)
    if (filters.category) qs.set('category', filters.category)
    if (filters.q) qs.set('q', filters.q)
    const s = qs.toString()
    return api({ path: `/catalogue/prices${s ? `?${s}` : ''}`, schema: z.array(PriceRecordSchema) })
  },
  submit: (input: PriceSubmissionInput) => api({ method: 'POST', path: '/catalogue/prices', body: input, schema: PriceRecordSchema }),
  decide: (id: string, decision: PriceDecision) =>
    api({ method: 'POST', path: `/catalogue/prices/${id}/decision`, body: decision, schema: PriceRecordSchema }),
}
