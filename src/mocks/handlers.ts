/**
 * In-browser mock backend.
 *
 * Mirrors the REST contract in docs/API.md so the app runs end-to-end without
 * a server. State lives in memory and is persisted to localStorage so a page
 * reload (or an offline session) keeps projects, BOQ overrides and sessions.
 */
import type {
  Boq,
  BoqOverride,
  BoqStatus,
  EstimateParams,
  EstimateResult,
  ParseIntentResult,
  PriceRecord,
  Project,
  Scenario,
  Session,
  TraceNode,
  User,
} from '@/shared/api/schemas'
import {
  BoqOverrideInputSchema,
  CostToCompleteRequestSchema,
  CreateProjectSchema,
  EstimateParamsSchema,
  PriceDecisionSchema,
  PriceSubmissionSchema,
  ReverseBudgetRequestSchema,
  StageReachRequestSchema,
  VerifyOtpSchema,
} from '@/shared/api/schemas'
import { costToComplete, generateBoq, reverseBudget, runEstimate, stageReach } from './engine'
import { DEMO_OTP, LOCATIONS, PRICES, SEED_PROJECTS, USERS } from './data'

export interface MockResponse {
  status: number
  body: unknown
}

interface Db {
  projects: Project[]
  scenarios: Scenario[]
  estimates: Record<string, { params: EstimateParams; projectId: string | null }>
  overrides: Record<string, BoqOverride>
  boqMeta: Record<string, { version: number; status: BoqStatus }>
  prices: PriceRecord[]
  sessions: Record<string, string> // token → userId
}

const DB_KEY = 'ccbf-mock-db-v1'

function loadDb(): Db {
  try {
    const raw = globalThis.localStorage?.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    /* ignore corrupt storage */
  }
  return {
    projects: structuredClone(SEED_PROJECTS),
    scenarios: [],
    estimates: {},
    overrides: {},
    boqMeta: {},
    prices: structuredClone(PRICES),
    sessions: {},
  }
}

let db: Db = loadDb()
const traces = new Map<string, Map<string, TraceNode>>()

function save() {
  try {
    globalThis.localStorage?.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* quota or private mode */
  }
}

/** Reset the mock DB (used by tests and the settings page). */
export function resetMockDb() {
  globalThis.localStorage?.removeItem(DB_KEY)
  db = loadDb()
  traces.clear()
}

class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

const nowIso = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

function ensureEstimate(params: EstimateParams, projectId: string | null): EstimateResult {
  const { result, trace } = runEstimate(params, LOCATIONS)
  db.estimates[result.id] = { params, projectId }
  traces.set(result.id, trace)
  save()
  return { ...result, projectId }
}

function getEstimate(id: string): EstimateResult {
  const rec = db.estimates[id]
  if (!rec) throw new HttpError(404, 'estimate_not_found', 'Estimate not found')
  return ensureEstimate(rec.params, rec.projectId)
}

function currentUser(headers: Record<string, string>): User | null {
  const auth = headers['authorization'] ?? headers['Authorization']
  const token = auth?.replace(/^Bearer\s+/i, '')
  const userId = token ? db.sessions[token] : undefined
  return USERS.find((u) => u.id === userId) ?? null
}

function requireUser(headers: Record<string, string>): User {
  const u = currentUser(headers)
  if (!u) throw new HttpError(401, 'unauthenticated', 'Sign in to continue')
  return u
}

function visibleProjects(user: User): Project[] {
  if (user.role === 'platform_admin') return db.projects
  return db.projects.filter((p) => p.ownerId === user.id || (p.companyId && p.companyId === user.companyId))
}

function projectFor(user: User, id: string): Project {
  const p = visibleProjects(user).find((x) => x.id === id)
  if (!p) throw new HttpError(404, 'project_not_found', 'Project not found')
  return p
}

function boqFor(project: Project): Boq {
  const params = { ...project.params, requestedClass: 4 as const }
  const est = ensureEstimate(params, project.id)
  const meta = db.boqMeta[project.id]
  return { ...generateBoq(est, db.prices, db.overrides, meta), projectId: project.id }
}

/* ---------- Natural-language parsing (rules-only; the real service adds an LLM) ---------- */
export function parseIntent(text: string): ParseIntentResult {
  const t = text.toLowerCase()
  const extracted: ParseIntentResult['extracted'] = {}
  const typo: Array<[RegExp, EstimateParams['typology']]> = [
    [/apartment|flats?|appartement|amazu y'ubukode/, 'apartments'],
    [/hotel|lodge|hôtel|guest ?house/, 'hotel'],
    [/school|école|ishuri/, 'school'],
    [/office|bureau|ibiro/, 'office'],
    [/shop|boutique|commercial|iduka/, 'shop'],
    [/house|home|villa|maison|inzu|bungalow|residence/, 'house'],
  ]
  for (const [re, v] of typo) if (re.test(t)) { extracted.typology = v; break }
  const bed = t.match(/(\d+)\s*-?\s*(bed|chambres?|ibyumba)/) ?? t.match(/(?:ibyumba|chambres?|bedrooms?)\s*(?:byo kuryamamo\s*)?(\d+)/)
  if (bed) extracted.bedrooms = Number(bed[1])
  const area = t.match(/(\d{2,5})\s*(m2|m²|sqm|square|metres? carr|metero kare)/)
  if (area) extracted.gfa = Number(area[1])
  if (/two[- ]?stor|2[- ]?stor|double[- ]stor|deux étages|r\+1|amagorofa abiri/.test(t)) extracted.storeys = 2
  else if (/three[- ]?stor|3[- ]?stor|trois étages|r\+2/.test(t)) extracted.storeys = 3
  else if (/bungalow|single[- ]stor|one[- ]stor|plain-pied|rez-de-chauss/.test(t)) extracted.storeys = 1
  for (const l of LOCATIONS) if (t.includes(l.name.toLowerCase())) extracted.locationId = l.id
  if (/luxur|luxe|high[- ]end/.test(t)) extracted.quality = 'LUX'
  else if (/premium|haut de gamme|quality/.test(t)) extracted.quality = 'PRM'
  else if (/cheap|economy|basic|budget|économique|low[- ]cost|ihendutse/.test(t)) extracted.quality = 'ECO'
  const features: EstimateParams['features'] = []
  if (/solar|solaire|imirasire/.test(t)) features.push('solar')
  if (/pool|piscine/.test(t)) features.push('pool')
  if (/generator|groupe électrogène/.test(t)) features.push('generator')
  if (/boundary|fence|wall around|clôture|uruzitiro/.test(t)) features.push('boundaryWall')
  if (/garage/.test(t)) extracted.rooms = { garage: true, office: false, store: false, separateKitchen: false }
  if (features.length) extracted.features = features
  if (extracted.bedrooms && !extracted.gfa) extracted.gfa = 60 + extracted.bedrooms * 40
  const missing: ParseIntentResult['missing'] = []
  if (!extracted.typology) missing.push('typology')
  if (!extracted.locationId) missing.push('locationId')
  if (!extracted.gfa) missing.push('gfa')
  if (!extracted.storeys) missing.push('storeys')
  return { extracted, missing: missing.slice(0, 3), provenance: 'rules' }
}

/* ---------- Route table ---------- */
type Handler = (ctx: {
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
  headers: Record<string, string>
}) => unknown

const routes: Array<{ method: string; pattern: RegExp; keys: string[]; handler: Handler }> = []

function route(method: string, path: string, handler: Handler) {
  const keys: string[] = []
  const pattern = new RegExp(
    '^' + path.replace(/:(\w+)/g, (_, k: string) => { keys.push(k); return '([^/]+)' }) + '/?$',
  )
  routes.push({ method, pattern, keys, handler })
}

// Auth
route('POST', '/auth/otp/request', ({ body }) => {
  const { identifier } = body as { identifier: string }
  const user = USERS.find((u) => u.email === identifier.toLowerCase())
  return { sent: true, hint: user ? `Demo code: ${DEMO_OTP}` : `Unknown user in demo. Try client@demo.rw (code ${DEMO_OTP}).` }
})
route('POST', '/auth/otp/verify', ({ body }) => {
  const input = VerifyOtpSchema.parse(body)
  const user = USERS.find((u) => u.email === input.identifier.toLowerCase())
  if (!user || input.code !== DEMO_OTP) throw new HttpError(401, 'invalid_code', 'Invalid code or user')
  const token = `mock.${user.id}.${Math.random().toString(36).slice(2)}`
  db.sessions[token] = user.id
  save()
  const session: Session = { token, expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(), user }
  return session
})
route('GET', '/auth/me', ({ headers }) => requireUser(headers))
route('POST', '/auth/logout', ({ headers }) => {
  const token = (headers['authorization'] ?? '').replace(/^Bearer\s+/i, '')
  delete db.sessions[token]
  save()
  return { ok: true }
})

// Reference data
route('GET', '/locations', () => LOCATIONS)

// Estimates
route('POST', '/estimates', ({ body, query }) => {
  const params = EstimateParamsSchema.parse(body)
  return ensureEstimate(params, query.get('projectId'))
})
route('GET', '/estimates/:id', ({ params }) => getEstimate(params.id!))
route('GET', '/estimates/:id/trace/:figureId', ({ params }) => {
  const est = getEstimate(params.id!)
  const figureId = decodeURIComponent(params.figureId!)
  const node = traces.get(est.id)?.get(figureId)
  if (!node) {
    // BOQ figures: synthesise a trace from the item.
    if (figureId.includes(':boq:')) {
      const rec = db.estimates[est.id]
      const project = rec?.projectId ? db.projects.find((p) => p.id === rec.projectId) : undefined
      const boq = project ? boqFor(project) : null
      const item = boq?.bills.flatMap((b) => b.items).find((i) => i.figureId === figureId)
      if (item) {
        const t: TraceNode = {
          id: figureId,
          label: `${item.code} ${item.description}`,
          value: item.amount,
          unit: 'RWF',
          formula: 'qty × (1 + waste %) × rate',
          inputs: [
            { name: `Quantity (${item.qtySource})`, value: item.qty, unit: item.unit },
            { name: 'Quantity formula', value: item.formula ?? '—' },
            { name: 'Waste', value: item.wastePct, unit: '%' },
            { name: 'Rate', value: item.rate, unit: `RWF/${item.unit}` },
          ],
          assumptions: item.override ? [`Override: ${item.override.reason}`] : ['Parametric quantity from estimate model'],
          wastePct: item.wastePct,
          price: item.rateProvenance
            ? {
                priceId: item.rateProvenance.priceId,
                source: item.rateProvenance.source,
                sourceDate: item.rateProvenance.sourceDate,
                confidence: item.rateProvenance.confidence,
                verified: item.rateProvenance.verified,
              }
            : undefined,
          lastUpdated: item.override?.changedAt ?? est.createdAt,
          changedBy: item.override?.changedBy ?? 'engine',
          children: [],
        }
        return t
      }
    }
    throw new HttpError(404, 'figure_not_found', 'No trace for this figure')
  }
  return node
})
route('POST', '/estimates/parse', ({ body }) => parseIntent(String((body as { text: string }).text ?? '')))
route('POST', '/estimates/reverse', ({ body }) => reverseBudget(ReverseBudgetRequestSchema.parse(body), LOCATIONS))
route('POST', '/estimates/stage-reach', ({ body }) => {
  const req = StageReachRequestSchema.parse(body)
  return stageReach(ensureEstimate(req.params, null), req.budget)
})
route('POST', '/estimates/cost-to-complete', ({ body }) => {
  const req = CostToCompleteRequestSchema.parse(body)
  return costToComplete(req, ensureEstimate(req.params, null))
})

// Projects
function withLatest(p: Project): Project {
  const est = ensureEstimate(p.params, p.id)
  return { ...p, latestEstimateId: est.id, latestTotalMid: est.total.mid, estimateClass: est.estimateClass }
}
route('GET', '/projects', ({ headers, query }) => {
  const user = requireUser(headers)
  const q = (query.get('q') ?? '').toLowerCase()
  const items = visibleProjects(user)
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.locationName.toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(withLatest)
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
})
route('POST', '/projects', ({ headers, body }) => {
  const user = requireUser(headers)
  if (user.role === 'supplier') throw new HttpError(403, 'forbidden', 'Suppliers cannot create projects')
  const input = CreateProjectSchema.parse(body)
  const loc = LOCATIONS.find((l) => l.id === input.params.locationId)
  const project: Project = {
    id: uid('prj'),
    name: input.name,
    typology: input.params.typology,
    locationId: input.params.locationId,
    locationName: loc?.name ?? input.params.locationId,
    estimateClass: input.params.requestedClass > 2 ? 2 : input.params.requestedClass,
    status: 'draft',
    ownerId: user.id,
    companyId: user.companyId,
    params: input.params,
    latestEstimateId: null,
    latestTotalMid: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  db.projects.unshift(project)
  save()
  return withLatest(project)
})
route('GET', '/projects/:id', ({ headers, params }) => withLatest(projectFor(requireUser(headers), params.id!)))
route('PATCH', '/projects/:id', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (user.role === 'client' && (body as { params?: unknown }).params) {
    // Clients may change inputs but never rates; params are inputs so this is allowed.
  }
  const p = projectFor(user, params.id!)
  const patch = body as Partial<Pick<Project, 'name' | 'params' | 'status'>>
  if (patch.params) p.params = EstimateParamsSchema.parse(patch.params)
  if (patch.name) p.name = patch.name
  if (patch.status) p.status = patch.status
  p.updatedAt = nowIso()
  save()
  return withLatest(p)
})
route('DELETE', '/projects/:id', ({ headers, params }) => {
  const user = requireUser(headers)
  const p = projectFor(user, params.id!)
  db.projects = db.projects.filter((x) => x.id !== p.id)
  db.scenarios = db.scenarios.filter((s) => s.projectId !== p.id)
  save()
  return { ok: true }
})

// Scenarios
route('GET', '/projects/:id/scenarios', ({ headers, params }) => {
  projectFor(requireUser(headers), params.id!)
  return db.scenarios.filter((s) => s.projectId === params.id)
})
route('POST', '/projects/:id/scenarios', ({ headers, params, body }) => {
  const project = projectFor(requireUser(headers), params.id!)
  const input = body as { name: string; params: unknown }
  const p = EstimateParamsSchema.parse(input.params)
  const est = ensureEstimate(p, project.id)
  const scenario: Scenario = { id: uid('scn'), projectId: project.id, name: input.name, params: p, estimateId: est.id, totalMid: est.total.mid, createdAt: nowIso() }
  db.scenarios.push(scenario)
  save()
  return scenario
})
route('DELETE', '/projects/:id/scenarios/:sid', ({ headers, params }) => {
  projectFor(requireUser(headers), params.id!)
  db.scenarios = db.scenarios.filter((s) => s.id !== params.sid)
  save()
  return { ok: true }
})

// BOQ
const PRO_ROLES = new Set(['architect', 'engineer', 'qs', 'contractor', 'company_admin', 'platform_admin'])
route('GET', '/projects/:id/boq', ({ headers, params }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role) && user.role !== 'pm') throw new HttpError(403, 'forbidden', 'Professional mode required')
  return boqFor(projectFor(user, params.id!))
})
route('PUT', '/projects/:id/boq/items/:itemId/override', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role)) throw new HttpError(403, 'forbidden', 'You cannot edit quantities or rates')
  const project = projectFor(user, params.id!)
  const input = BoqOverrideInputSchema.parse(body)
  const key = decodeURIComponent(params.itemId!)
  db.overrides[key] = { qty: input.qty, rate: input.rate, wastePct: input.wastePct, reason: input.reason, changedBy: user.name, changedAt: nowIso() }
  save()
  return boqFor(project)
})
route('DELETE', '/projects/:id/boq/items/:itemId/override', ({ headers, params }) => {
  const user = requireUser(headers)
  const project = projectFor(user, params.id!)
  delete db.overrides[decodeURIComponent(params.itemId!)]
  save()
  return boqFor(project)
})
route('POST', '/projects/:id/boq/transition', ({ headers, params, body }) => {
  const user = requireUser(headers)
  const project = projectFor(user, params.id!)
  const { status } = body as { status: BoqStatus }
  const meta = db.boqMeta[project.id] ?? { version: 1, status: 'draft' as BoqStatus }
  const canApprove = ['qs', 'contractor', 'company_admin'].includes(user.role) || user.grants.includes('approve_boq')
  if ((status === 'approved' || status === 'issued') && !canApprove) throw new HttpError(403, 'forbidden', 'You are not allowed to approve this BOQ')
  if (status === 'issued') {
    const boq = boqFor(project)
    if (boq.exportBlockedReasons.length) throw new HttpError(409, 'export_blocked', 'Stale or missing prices block issue', boq.exportBlockedReasons)
  }
  const next = { version: status === 'draft' && meta.status === 'issued' ? meta.version + 1 : meta.version, status }
  db.boqMeta[project.id] = next
  save()
  return boqFor(project)
})
route('POST', '/projects/:id/boq/export', ({ headers, params, body }) => {
  const user = requireUser(headers)
  const project = projectFor(user, params.id!)
  const boq = boqFor(project)
  const { format } = body as { format: 'csv' | 'xlsx' | 'pdf' }
  const professional = PRO_ROLES.has(user.role) || user.role === 'pm'
  if (professional && boq.exportBlockedReasons.length) {
    throw new HttpError(409, 'export_blocked', 'Stale or missing prices block professional BOQ export', boq.exportBlockedReasons)
  }
  const rows = [['Item', 'Description', 'Unit', 'Qty', 'Rate', 'Amount']]
  for (const bill of boq.bills) {
    rows.push([`Bill ${bill.code}`, bill.name, '', '', '', ''])
    for (const it of bill.items) {
      rows.push(professional ? [it.code, it.description, it.unit, String(it.qty), String(it.rate), String(it.amount)] : [it.code, it.description, it.unit, '', '', ''])
    }
    rows.push(['', `Subtotal bill ${bill.code}`, '', '', '', professional ? String(bill.subtotal) : ''])
  }
  rows.push(['', 'Measured work', '', '', '', String(boq.measuredSubtotal)])
  rows.push(['', `Contingency ${boq.contingencyPct} %`, '', '', '', String(boq.contingency)])
  rows.push(['', `VAT ${boq.vatPct} %`, '', '', '', String(boq.vat)])
  rows.push(['', 'Grand total', '', '', '', String(boq.grandTotal)])
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  return {
    filename: `${project.name.replace(/\s+/g, '_')}_BOQ_v${boq.version}.${format === 'csv' ? 'csv' : format}`,
    mime: 'text/csv',
    content: csv,
    note: format === 'csv' ? null : 'Mock backend exports CSV content; the real report service renders Excel/PDF asynchronously.',
  }
})

// Catalogue
route('GET', '/catalogue/prices', ({ headers, query }) => {
  const user = requireUser(headers)
  const status = query.get('status')
  const category = query.get('category')
  const q = (query.get('q') ?? '').toLowerCase()
  if (status && status !== 'approved' && user.role !== 'platform_admin') throw new HttpError(403, 'forbidden', 'Admins only')
  return db.prices.filter(
    (p) => (!status || p.status === status) && (!category || p.category === category) && (!q || p.name.toLowerCase().includes(q) || p.materialId.toLowerCase().includes(q)),
  )
})
route('POST', '/catalogue/prices', ({ headers, body }) => {
  const user = requireUser(headers)
  const input = PriceSubmissionSchema.parse(body)
  const ref = db.prices.find((p) => p.materialId === input.materialId && p.status === 'approved')
  if (!ref) throw new HttpError(404, 'material_not_found', 'Unknown material')
  const anomalyPct = Number((((input.price - ref.price) / ref.price) * 100).toFixed(1))
  const rec: PriceRecord = {
    ...ref,
    id: uid('pr'),
    price: input.price,
    locationId: input.locationId,
    source: input.source,
    sourceDate: input.sourceDate,
    verified: false,
    status: Math.abs(anomalyPct) > 25 ? 'flagged' : 'pending',
    submittedBy: user.id,
    anomalyPct,
    companyId: user.companyId,
  }
  db.prices.unshift(rec)
  save()
  return rec
})
route('POST', '/catalogue/prices/:id/decision', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (user.role !== 'platform_admin') throw new HttpError(403, 'forbidden', 'Only platform admins approve global prices')
  const input = PriceDecisionSchema.parse(body)
  const rec = db.prices.find((p) => p.id === params.id)
  if (!rec) throw new HttpError(404, 'price_not_found', 'Price not found')
  if (input.decision === 'approve') {
    for (const p of db.prices) if (p.materialId === rec.materialId && p.status === 'approved' && p.locationId === rec.locationId) p.status = 'rejected'
    rec.status = 'approved'
    rec.verified = true
    rec.confidence = 'high'
  } else {
    rec.status = 'rejected'
  }
  save()
  return rec
})

/* ---------- Dispatcher ---------- */
export async function mockFetch(
  method: string,
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<MockResponse> {
  const [pathPart, queryPart] = url.split('?')
  const path = (pathPart ?? '').replace(/^\/api/, '')
  const query = new URLSearchParams(queryPart ?? '')
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180))
  for (const r of routes) {
    if (r.method !== method.toUpperCase()) continue
    const m = r.pattern.exec(path)
    if (!m) continue
    const params: Record<string, string> = {}
    r.keys.forEach((k, i) => (params[k] = m[i + 1] ?? ''))
    try {
      return { status: 200, body: r.handler({ params, query, body, headers }) }
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, body: { code: e.code, message: e.message, details: e.details } }
      if (e && typeof e === 'object' && 'issues' in e) return { status: 422, body: { code: 'validation_error', message: 'Invalid input', details: (e as { issues: unknown }).issues } }
      return { status: 500, body: { code: 'internal', message: (e as Error).message } }
    }
  }
  return { status: 404, body: { code: 'not_found', message: `No route ${method} ${path}` } }
}
