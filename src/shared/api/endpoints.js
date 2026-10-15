/** Typed endpoint functions. Hooks in features/* wrap these with TanStack Query. */
import { z } from 'zod'
import { api } from './client'
import {
  ActivitySchema,
  PlatformConfigSchema,
  PublicConfigSchema,
  BoqSchema,
  BoqSummarySchema,
  DashboardSchema,
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

const OkSchema = z.object({ ok: z.boolean() })

export const authApi = {
  requestOtp: (identifier) =>
    api({
      method: 'POST',
      path: '/auth/otp/request',
      body: { identifier },
      schema: z.object({ sent: z.boolean(), hint: z.string().optional() }),
    }),
  verifyOtp: (input) => api({ method: 'POST', path: '/auth/otp/verify', body: input, schema: SessionSchema }),
  me: () => api({ path: '/auth/me', schema: UserSchema }),
  logout: () => api({ method: 'POST', path: '/auth/logout', schema: OkSchema }),
}

export const referenceApi = {
  locations: () => api({ path: '/locations', schema: z.array(LocationSchema) }),
  config: () => api({ path: '/config', schema: PublicConfigSchema }),
}

export const adminApi = {
  config: () => api({ path: '/admin/config', schema: PlatformConfigSchema }),
  saveConfig: (input) => api({ method: 'PUT', path: '/admin/config', body: input, schema: PlatformConfigSchema }),
  resetConfig: () => api({ method: 'POST', path: '/admin/config/reset', schema: PlatformConfigSchema }),
}

export const estimateApi = {
  run: (params, projectId) =>
    api({
      method: 'POST',
      path: `/estimates${projectId ? `?projectId=${projectId}` : ''}`,
      body: params,
      schema: EstimateResultSchema,
    }),
  get: (id) => api({ path: `/estimates/${id}`, schema: EstimateResultSchema }),
  trace: (id, figureId) =>
    api({ path: `/estimates/${id}/trace/${encodeURIComponent(figureId)}`, schema: TraceNodeSchema }),
  parse: (text) => api({ method: 'POST', path: '/estimates/parse', body: { text }, schema: ParseIntentResultSchema }),
  reverse: (req) => api({ method: 'POST', path: '/estimates/reverse', body: req, schema: ReverseBudgetResultSchema }),
  stageReach: (req) =>
    api({ method: 'POST', path: '/estimates/stage-reach', body: req, schema: StageReachResultSchema }),
  costToComplete: (req) =>
    api({ method: 'POST', path: '/estimates/cost-to-complete', body: req, schema: CostToCompleteResultSchema }),
}

export const projectApi = {
  list: (q) =>
    api({ path: `/projects${q ? `?q=${encodeURIComponent(q)}` : ''}`, schema: PaginatedSchema(ProjectSchema) }),
  get: (id) => api({ path: `/projects/${id}`, schema: ProjectSchema }),
  create: (input) => api({ method: 'POST', path: '/projects', body: input, schema: ProjectSchema }),
  update: (id, patch) => api({ method: 'PATCH', path: `/projects/${id}`, body: patch, schema: ProjectSchema }),
  remove: (id) => api({ method: 'DELETE', path: `/projects/${id}`, schema: OkSchema }),
  scenarios: (id) => api({ path: `/projects/${id}/scenarios`, schema: z.array(ScenarioSchema) }),
  addScenario: (id, name, params) =>
    api({ method: 'POST', path: `/projects/${id}/scenarios`, body: { name, params }, schema: ScenarioSchema }),
  removeScenario: (id, sid) => api({ method: 'DELETE', path: `/projects/${id}/scenarios/${sid}`, schema: OkSchema }),
}

export const ExportResultSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  content: z.string(),
  note: z.string().nullable(),
})

export const boqApi = {
  get: (projectId) => api({ path: `/projects/${projectId}/boq`, schema: BoqSchema }),
  override: (projectId, itemId, input) =>
    api({
      method: 'PUT',
      path: `/projects/${projectId}/boq/items/${encodeURIComponent(itemId)}/override`,
      body: input,
      schema: BoqSchema,
    }),
  resetOverride: (projectId, itemId) =>
    api({
      method: 'DELETE',
      path: `/projects/${projectId}/boq/items/${encodeURIComponent(itemId)}/override`,
      schema: BoqSchema,
    }),
  transition: (projectId, status) =>
    api({ method: 'POST', path: `/projects/${projectId}/boq/transition`, body: { status }, schema: BoqSchema }),
  export: (projectId, format) =>
    api({ method: 'POST', path: `/projects/${projectId}/boq/export`, body: { format }, schema: ExportResultSchema }),
  addItem: (projectId, input) =>
    api({ method: 'POST', path: `/projects/${projectId}/boq/items`, body: input, schema: BoqSchema }),
  removeItem: (projectId, itemId) =>
    api({
      method: 'DELETE',
      path: `/projects/${projectId}/boq/items/${encodeURIComponent(itemId)}`,
      schema: BoqSchema,
    }),
  setAdjustments: (projectId, input) =>
    api({ method: 'PUT', path: `/projects/${projectId}/boq/adjustments`, body: input, schema: BoqSchema }),
  list: () => api({ path: '/boqs', schema: z.array(BoqSummarySchema) }),
}

export const dashboardApi = {
  get: () => api({ path: '/dashboard', schema: DashboardSchema }),
}
void ActivitySchema

export const catalogueApi = {
  prices: (filters) => {
    const qs = new URLSearchParams()
    if (filters.status) qs.set('status', filters.status)
    if (filters.category) qs.set('category', filters.category)
    if (filters.q) qs.set('q', filters.q)
    const s = qs.toString()
    return api({ path: `/catalogue/prices${s ? `?${s}` : ''}`, schema: z.array(PriceRecordSchema) })
  },
  submit: (input) => api({ method: 'POST', path: '/catalogue/prices', body: input, schema: PriceRecordSchema }),
  decide: (id, decision) =>
    api({ method: 'POST', path: `/catalogue/prices/${id}/decision`, body: decision, schema: PriceRecordSchema }),
}
