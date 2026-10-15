import {
  PlatformConfigSchema,
  PublicConfigSchema,
  SaveConfigSchema,
  BoqAdjustmentsSchema,
  BoqCustomItemInputSchema,
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
import {
  costToComplete,
  generateBoq,
  reverseBudget,
  runEstimate,
  stageReach,
  DEFAULT_CONFIG,
  resolveConfig,
  rulesFromConfig,
} from './engine'
import i18n, { SUPPORTED_LOCALES } from '@/shared/i18n'

import { DEMO_OTP, PRICES, SEED_PROJECTS, USERS } from './data'

const DB_KEY = 'ccbf-mock-db-v4'

/**
 * Activity entries store `{ messageKey, messageParams }` (keys under `engine.activity`) rather than
 * prose, so a log written in one language is read back in whichever language the dashboard asks for.
 */
const SEED_ACTIVITY = [
  {
    id: 'act_seed1',
    type: 'project_updated',
    projectId: 'prj_nyarugenge',
    projectName: 'Nyarugenge apartments block A',
    messageKey: 'engine.activity.seed.nyarugenge',
    actor: 'Jean Habimana',
    at: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'act_seed2',
    type: 'project_updated',
    projectId: 'prj_kicukiro',
    projectName: 'Kicukiro family house',
    messageKey: 'engine.activity.seed.kicukiro',
    actor: 'Aline Uwase',
    at: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'act_seed3',
    type: 'price_submitted',
    projectId: null,
    projectName: null,
    messageKey: 'engine.activity.seed.rebar',
    actor: 'Patrick Nsengimana',
    at: '2026-10-09T08:30:00.000Z',
  },
  {
    id: 'act_seed4',
    type: 'project_updated',
    projectId: 'prj_musanze',
    projectName: 'Musanze guest lodge',
    messageKey: 'engine.activity.seed.musanze',
    actor: 'Eric Mugisha',
    at: '2026-09-28T10:00:00.000Z',
  },
]

function loadDb() {
  try {
    const raw = globalThis.localStorage?.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
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
    activity: structuredClone(SEED_ACTIVITY),
    config: structuredClone(DEFAULT_CONFIG),
  }
}

/**
 * Language of the request being handled (from `Accept-Language`). Handlers are
 * synchronous, so a module-level value is safe; it decides the language of
 * every name, label and message the mock backend returns.
 */
let lang = 'en'
export const currentLang = () => lang
const langFromHeaders = (headers = {}) => {
  const raw = String(headers['Accept-Language'] ?? headers['accept-language'] ?? 'en')
    .split(',')[0]
    .trim()
    .slice(0, 2)
    .toLowerCase()
  return SUPPORTED_LOCALES.includes(raw) ? raw : 'en'
}

/** Translates a dictionary key in the language of the request being handled. */
const tr = (key, params) => i18n.getFixedT(lang)(key, params)

const rules = () => rulesFromConfig(db.config, lang)
/** Locations come from configuration (admin-editable); disabled ones stay resolvable for old projects. */
const allLocations = () => db.config.locations.map(({ id, name, province, factor }) => ({ id, name, province, factor }))
const enabledLocations = () =>
  db.config.locations.filter((l) => l.enabled).map(({ id, name, province, factor }) => ({ id, name, province, factor }))

function publicConfig(config) {
  const c = resolveConfig(config, lang)
  return PublicConfigSchema.parse({
    version: c.version,
    branding: c.branding,
    homepage: c.homepage,
    typologies: c.typologies.map(({ id, label, enabled }) => ({ id, label, enabled })),
    qualities: c.qualities.map(({ id, label, description }) => ({ id, label, description })),
    elementLabels: c.elementLabels,
    phaseNames: c.phaseNames,
    features: c.features.map(({ id, label, enabled }) => ({ id, label, enabled })),
    locations: c.locations.filter((l) => l.enabled),
    classes: c.classes,
    localization: c.localization,
    workflow: { maxEssentialQuestions: c.workflow.maxEssentialQuestions },
  })
}

/** Appends an entry; `messageKey`/`messageParams` are resolved to `message` when the log is read. */
function logActivity(entry) {
  db.activity.unshift({ ...entry, id: uid('act'), at: nowIso() })
  db.activity = db.activity.slice(0, 200)
}

/** Activity entry as served: `message` rendered in the request language (legacy entries keep their stored text). */
function renderActivity({ messageKey, messageParams, ...entry }) {
  return { ...entry, message: messageKey ? tr(messageKey, messageParams ?? {}) : (entry.message ?? '') }
}

let db = loadDb()
const traces = new Map()

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
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const nowIso = () => new Date().toISOString()
const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

function ensureEstimate(params, projectId) {
  const { result, trace } = runEstimate(params, allLocations(), rules())
  db.estimates[result.id] = { params, projectId }
  traces.set(result.id, trace)
  save()
  return { ...result, projectId }
}

function getEstimate(id) {
  const rec = db.estimates[id]
  if (!rec) throw new HttpError(404, 'estimate_not_found', tr('engine.errors.estimateNotFound'))
  return ensureEstimate(rec.params, rec.projectId)
}

function currentUser(headers) {
  const auth = headers['authorization'] ?? headers['Authorization']
  const token = auth?.replace(/^Bearer\s+/i, '')
  const userId = token ? db.sessions[token] : undefined
  return USERS.find((u) => u.id === userId) ?? null
}

function requireUser(headers) {
  const u = currentUser(headers)
  if (!u) throw new HttpError(401, 'unauthenticated', tr('engine.errors.unauthenticated'))
  return u
}

function visibleProjects(user) {
  if (user.role === 'platform_admin') return db.projects
  return db.projects.filter((p) => p.ownerId === user.id || (p.companyId && p.companyId === user.companyId))
}

function projectFor(user, id) {
  const p = visibleProjects(user).find((x) => x.id === id)
  if (!p) throw new HttpError(404, 'project_not_found', tr('engine.errors.projectNotFound'))
  return p
}

function boqFor(project) {
  const params = { ...project.params, requestedClass: 4 }
  const est = ensureEstimate(params, project.id)
  const meta = db.boqMeta[project.id]
  return { ...generateBoq(est, db.prices, db.overrides, meta, rules()), projectId: project.id }
}

function metaFor(projectId) {
  return (db.boqMeta[projectId] ??= { version: 1, status: 'draft' })
}

/* ---------- Natural-language parsing (rules-only; the real service adds an LLM) ---------- */
export function parseIntent(text) {
  const t = text.toLowerCase()
  const extracted = {}
  const typo = [
    [/apartment|flats?|appartement|amazu y'ubukode/, 'apartments'],
    [/hotel|lodge|hôtel|guest ?house/, 'hotel'],
    [/school|école|ishuri/, 'school'],
    [/office|bureau|ibiro/, 'office'],
    [/shop|boutique|commercial|iduka/, 'shop'],
    [/house|home|villa|maison|inzu|bungalow|residence/, 'house'],
  ]
  for (const [re, v] of typo)
    if (re.test(t)) {
      extracted.typology = v
      break
    }
  const bed =
    t.match(/(\d+)\s*-?\s*(bed|chambres?|ibyumba)/) ??
    t.match(/(?:ibyumba|chambres?|bedrooms?)\s*(?:byo kuryamamo\s*)?(\d+)/)
  if (bed) extracted.bedrooms = Number(bed[1])
  const area = t.match(/(\d{2,5})\s*(m2|m²|sqm|square|metres? carr|metero kare)/)
  if (area) extracted.gfa = Number(area[1])
  if (/two[- ]?stor|2[- ]?stor|double[- ]stor|deux étages|r\+1|amagorofa abiri/.test(t)) extracted.storeys = 2
  else if (/three[- ]?stor|3[- ]?stor|trois étages|r\+2/.test(t)) extracted.storeys = 3
  else if (/bungalow|single[- ]stor|one[- ]stor|plain-pied|rez-de-chauss/.test(t)) extracted.storeys = 1
  for (const l of db.config.locations) if (t.includes(l.name.toLowerCase())) extracted.locationId = l.id
  if (/luxur|luxe|high[- ]end/.test(t)) extracted.quality = 'LUX'
  else if (/premium|haut de gamme|quality/.test(t)) extracted.quality = 'PRM'
  else if (/cheap|economy|basic|budget|économique|low[- ]cost|ihendutse/.test(t)) extracted.quality = 'ECO'
  const features = []
  if (/solar|solaire|imirasire/.test(t)) features.push('solar')
  if (/pool|piscine/.test(t)) features.push('pool')
  if (/generator|groupe électrogène/.test(t)) features.push('generator')
  if (/boundary|fence|wall around|clôture|uruzitiro/.test(t)) features.push('boundaryWall')
  if (/garage/.test(t)) extracted.rooms = { garage: true, office: false, store: false, separateKitchen: false }
  if (features.length) extracted.features = features
  if (extracted.bedrooms && !extracted.gfa) extracted.gfa = 60 + extracted.bedrooms * 40
  const missing = []
  if (!extracted.typology) missing.push('typology')
  if (!extracted.locationId) missing.push('locationId')
  if (!extracted.gfa) missing.push('gfa')
  if (!extracted.storeys) missing.push('storeys')
  return { extracted, missing: missing.slice(0, 3), provenance: 'rules' }
}

/* ---------- Route table ---------- */

const routes = []

function route(method, path, handler) {
  const keys = []
  const pattern = new RegExp(
    '^' +
      path.replace(/:(\w+)/g, (_, k) => {
        keys.push(k)
        return '([^/]+)'
      }) +
      '/?$',
  )
  routes.push({ method, pattern, keys, handler })
}

// Auth
route('POST', '/auth/otp/request', ({ body }) => {
  const { identifier } = body
  const user = USERS.find((u) => u.email === identifier.toLowerCase())
  return {
    sent: true,
    hint: user ? tr('engine.otp.demoCode', { code: DEMO_OTP }) : tr('engine.otp.unknownUser', { code: DEMO_OTP }),
  }
})
route('POST', '/auth/otp/verify', ({ body }) => {
  const input = VerifyOtpSchema.parse(body)
  const user = USERS.find((u) => u.email === input.identifier.toLowerCase())
  if (!user || input.code !== DEMO_OTP) throw new HttpError(401, 'invalid_code', tr('engine.errors.invalidCode'))
  const token = `mock.${user.id}.${Math.random().toString(36).slice(2)}`
  db.sessions[token] = user.id
  save()
  const session = { token, expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(), user }
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
route('GET', '/locations', () => enabledLocations())
route('GET', '/config', () => publicConfig(db.config))

// Estimates
route('POST', '/estimates', ({ body, query }) => {
  const params = EstimateParamsSchema.parse(body)
  return ensureEstimate(params, query.get('projectId'))
})
route('GET', '/estimates/:id', ({ params }) => getEstimate(params.id))
route('GET', '/estimates/:id/trace/:figureId', ({ params }) => {
  const est = getEstimate(params.id)
  const figureId = decodeURIComponent(params.figureId)
  const node = traces.get(est.id)?.get(figureId)
  if (!node) {
    // BOQ figures: synthesise a trace from the item.
    if (figureId.includes(':boq:')) {
      const rec = db.estimates[est.id]
      const project = rec?.projectId ? db.projects.find((p) => p.id === rec.projectId) : undefined
      const boq = project ? boqFor(project) : null
      const item = boq?.bills.flatMap((b) => b.items).find((i) => i.figureId === figureId)
      if (item) {
        const t = {
          id: figureId,
          label: `${item.code} ${item.description}`,
          value: item.amount,
          unit: 'RWF',
          formula: tr('engine.trace.boq.formula'),
          inputs: [
            {
              name: tr('engine.trace.boq.quantity', { source: tr(`engine.trace.boq.source.${item.qtySource}`) }),
              value: item.qty,
              unit: item.unit,
            },
            { name: tr('engine.trace.boq.quantityFormula'), value: item.formula ?? '—' },
            { name: tr('engine.trace.boq.waste'), value: item.wastePct, unit: '%' },
            { name: tr('engine.trace.boq.rate'), value: item.rate, unit: `RWF/${item.unit}` },
          ],
          assumptions: item.override
            ? [tr('engine.trace.boq.override', { reason: item.override.reason })]
            : [tr('engine.trace.boq.parametric')],
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
    throw new HttpError(404, 'figure_not_found', tr('engine.errors.figureNotFound'))
  }
  return node
})
route('POST', '/estimates/parse', ({ body }) => parseIntent(String(body.text ?? '')))
route('POST', '/estimates/reverse', ({ body }) =>
  reverseBudget(ReverseBudgetRequestSchema.parse(body), enabledLocations(), rules()),
)
route('POST', '/estimates/stage-reach', ({ body }) => {
  const req = StageReachRequestSchema.parse(body)
  return stageReach(ensureEstimate(req.params, null), req.budget, rules())
})
route('POST', '/estimates/cost-to-complete', ({ body }) => {
  const req = CostToCompleteRequestSchema.parse(body)
  return costToComplete(req, ensureEstimate(req.params, null), rules())
})

// Projects
function withLatest(p) {
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
  if (user.role === 'supplier') throw new HttpError(403, 'forbidden', tr('engine.errors.suppliersCannotCreate'))
  const input = CreateProjectSchema.parse(body)
  const loc = db.config.locations.find((l) => l.id === input.params.locationId)
  const project = {
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
  logActivity({
    type: 'project_created',
    projectId: project.id,
    projectName: project.name,
    messageKey:
      project.estimateClass === 1 ? 'engine.activity.projectCreatedRough' : 'engine.activity.projectCreatedPreliminary',
    actor: user.name,
  })
  save()
  return withLatest(project)
})
route('GET', '/projects/:id', ({ headers, params }) => withLatest(projectFor(requireUser(headers), params.id)))
route('PATCH', '/projects/:id', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (user.role === 'client' && body.params) {
    // Clients may change inputs but never rates; params are inputs so this is allowed.
  }
  const p = projectFor(user, params.id)
  const patch = body
  if (patch.params) p.params = EstimateParamsSchema.parse(patch.params)
  if (patch.name) p.name = patch.name
  if (patch.status) p.status = patch.status
  p.updatedAt = nowIso()
  logActivity({
    type: 'project_updated',
    projectId: p.id,
    projectName: p.name,
    messageKey: patch.params
      ? 'engine.activity.inputsUpdated'
      : patch.status
        ? 'engine.activity.statusSet'
        : 'engine.activity.renamed',
    messageParams: patch.status && !patch.params ? { status: patch.status } : {},
    actor: user.name,
  })
  save()
  return withLatest(p)
})
route('DELETE', '/projects/:id', ({ headers, params }) => {
  const user = requireUser(headers)
  const p = projectFor(user, params.id)
  db.projects = db.projects.filter((x) => x.id !== p.id)
  db.scenarios = db.scenarios.filter((s) => s.projectId !== p.id)
  save()
  return { ok: true }
})

// Scenarios
route('GET', '/projects/:id/scenarios', ({ headers, params }) => {
  projectFor(requireUser(headers), params.id)
  return db.scenarios.filter((s) => s.projectId === params.id)
})
route('POST', '/projects/:id/scenarios', ({ headers, params, body }) => {
  const project = projectFor(requireUser(headers), params.id)
  const input = body
  const p = EstimateParamsSchema.parse(input.params)
  const est = ensureEstimate(p, project.id)
  const scenario = {
    id: uid('scn'),
    projectId: project.id,
    name: input.name,
    params: p,
    estimateId: est.id,
    totalMid: est.total.mid,
    createdAt: nowIso(),
  }
  db.scenarios.push(scenario)
  logActivity({
    type: 'scenario_added',
    projectId: project.id,
    projectName: project.name,
    messageKey: 'engine.activity.scenarioSaved',
    messageParams: { name: scenario.name },
    actor: requireUser(headers).name,
  })
  save()
  return scenario
})
route('DELETE', '/projects/:id/scenarios/:sid', ({ headers, params }) => {
  projectFor(requireUser(headers), params.id)
  db.scenarios = db.scenarios.filter((s) => s.id !== params.sid)
  save()
  return { ok: true }
})

// BOQ
const PRO_ROLES = new Set(['architect', 'engineer', 'qs', 'contractor', 'company_admin', 'platform_admin'])
route('GET', '/projects/:id/boq', ({ headers, params }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role) && user.role !== 'pm')
    throw new HttpError(403, 'forbidden', tr('engine.errors.professionalRequired'))
  return boqFor(projectFor(user, params.id))
})
route('PUT', '/projects/:id/boq/items/:itemId/override', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role)) throw new HttpError(403, 'forbidden', tr('engine.errors.cannotEditQuantities'))
  const project = projectFor(user, params.id)
  const input = BoqOverrideInputSchema.parse(body)
  if (!db.config.workflow.requireOverrideReason && !input.reason) input.reason = tr('engine.boq.noReasonRequired')
  const key = decodeURIComponent(params.itemId)
  db.overrides[key] = {
    qty: input.qty,
    rate: input.rate,
    wastePct: input.wastePct,
    reason: input.reason,
    changedBy: user.name,
    changedAt: nowIso(),
  }
  logActivity({
    type: 'boq_override',
    projectId: project.id,
    projectName: project.name,
    messageKey: 'engine.activity.boqOverridden',
    messageParams: { reason: input.reason },
    actor: user.name,
  })
  save()
  return boqFor(project)
})
route('DELETE', '/projects/:id/boq/items/:itemId/override', ({ headers, params }) => {
  const user = requireUser(headers)
  const project = projectFor(user, params.id)
  delete db.overrides[decodeURIComponent(params.itemId)]
  save()
  return boqFor(project)
})
route('POST', '/projects/:id/boq/transition', ({ headers, params, body }) => {
  const user = requireUser(headers)
  const project = projectFor(user, params.id)
  const { status } = body
  const meta = db.boqMeta[project.id] ?? { version: 1, status: 'draft' }
  const canApprove = db.config.workflow.approveBoqRoles.includes(user.role) || user.grants.includes('approve_boq')
  if ((status === 'approved' || status === 'issued') && !canApprove)
    throw new HttpError(403, 'forbidden', tr('engine.errors.cannotApproveBoq'))
  if (status === 'issued') {
    const boq = boqFor(project)
    if (boq.exportBlockedReasons.length)
      throw new HttpError(409, 'export_blocked', tr('engine.errors.exportBlockedIssue'), boq.exportBlockedReasons)
  }
  db.boqMeta[project.id] = {
    ...meta,
    version: status === 'draft' && meta.status === 'issued' ? meta.version + 1 : meta.version,
    status,
  }
  logActivity({
    type: 'boq_transition',
    projectId: project.id,
    projectName: project.name,
    messageKey: 'engine.activity.boqTransition',
    messageParams: { version: db.boqMeta[project.id].version, status },
    actor: user.name,
  })
  save()
  return boqFor(project)
})
route('POST', '/projects/:id/boq/export', ({ headers, params, body }) => {
  const user = requireUser(headers)
  const project = projectFor(user, params.id)
  const boq = boqFor(project)
  const { format } = body
  const professional = PRO_ROLES.has(user.role) || user.role === 'pm'
  if (professional && boq.exportBlockedReasons.length) {
    throw new HttpError(409, 'export_blocked', tr('engine.errors.exportBlockedExport'), boq.exportBlockedReasons)
  }
  const rows = [
    [
      tr('engine.export.item'),
      tr('engine.export.description'),
      tr('engine.export.unit'),
      tr('engine.export.qty'),
      tr('engine.export.rate'),
      tr('engine.export.amount'),
    ],
  ]
  for (const bill of boq.bills) {
    rows.push([tr('engine.export.bill', { code: bill.code }), bill.name, '', '', '', ''])
    for (const it of bill.items) {
      rows.push(
        professional
          ? [it.code, it.description, it.unit, String(it.qty), String(it.rate), String(it.amount)]
          : [it.code, it.description, it.unit, '', '', ''],
      )
    }
    rows.push([
      '',
      tr('engine.export.subtotal', { code: bill.code }),
      '',
      '',
      '',
      professional ? String(bill.subtotal) : '',
    ])
  }
  rows.push(['', tr('engine.export.measuredWork'), '', '', '', String(boq.measuredSubtotal)])
  rows.push(['', tr('engine.export.contingency', { pct: boq.contingencyPct }), '', '', '', String(boq.contingency)])
  rows.push(['', tr('engine.export.vat', { pct: boq.vatPct }), '', '', '', String(boq.vat)])
  rows.push(['', tr('engine.export.grandTotal'), '', '', '', String(boq.grandTotal)])
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  return {
    filename: `${project.name.replace(/\s+/g, '_')}_BOQ_v${boq.version}.${format === 'csv' ? 'csv' : format}`,
    mime: 'text/csv',
    content: csv,
    note: format === 'csv' ? null : tr('engine.export.note'),
  }
})

// Catalogue
route('GET', '/catalogue/prices', ({ headers, query }) => {
  const user = requireUser(headers)
  const status = query.get('status')
  const category = query.get('category')
  const q = (query.get('q') ?? '').toLowerCase()
  if (status && status !== 'approved' && user.role !== 'platform_admin')
    throw new HttpError(403, 'forbidden', tr('engine.errors.adminsOnly'))
  return db.prices.filter(
    (p) =>
      (!status || p.status === status) &&
      (!category || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q) || p.materialId.toLowerCase().includes(q)),
  )
})
route('POST', '/catalogue/prices', ({ headers, body }) => {
  const user = requireUser(headers)
  const input = PriceSubmissionSchema.parse(body)
  const ref = db.prices.find((p) => p.materialId === input.materialId && p.status === 'approved')
  if (!ref) throw new HttpError(404, 'material_not_found', tr('engine.errors.unknownMaterial'))
  const anomalyPct = Number((((input.price - ref.price) / ref.price) * 100).toFixed(1))
  const rec = {
    ...ref,
    id: uid('pr'),
    price: input.price,
    locationId: input.locationId,
    source: input.source,
    sourceDate: input.sourceDate,
    verified: false,
    status: Math.abs(anomalyPct) > db.config.workflow.anomalyThresholdPct ? 'flagged' : 'pending',
    submittedBy: user.id,
    anomalyPct,
    companyId: user.companyId,
  }
  db.prices.unshift(rec)
  logActivity({
    type: 'price_submitted',
    projectId: null,
    projectName: null,
    messageKey: rec.status === 'flagged' ? 'engine.activity.priceSubmittedFlagged' : 'engine.activity.priceSubmitted',
    messageParams: { name: rec.name, price: rec.price.toLocaleString(), unit: rec.purchaseUnit },
    actor: user.name,
  })
  save()
  return rec
})
route('POST', '/catalogue/prices/:id/decision', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (user.role !== 'platform_admin') throw new HttpError(403, 'forbidden', tr('engine.errors.onlyAdminsApprovePrices'))
  const input = PriceDecisionSchema.parse(body)
  const rec = db.prices.find((p) => p.id === params.id)
  if (!rec) throw new HttpError(404, 'price_not_found', tr('engine.errors.priceNotFound'))
  if (input.decision === 'approve') {
    for (const p of db.prices)
      if (p.materialId === rec.materialId && p.status === 'approved' && p.locationId === rec.locationId)
        p.status = 'rejected'
    rec.status = 'approved'
    rec.verified = true
    rec.confidence = 'high'
  } else {
    rec.status = 'rejected'
  }
  logActivity({
    type: 'price_decision',
    projectId: null,
    projectName: null,
    messageKey: input.decision === 'approve' ? 'engine.activity.priceApproved' : 'engine.activity.priceRejected',
    messageParams: { name: rec.name },
    actor: user.name,
  })
  save()
  return rec
})

// Workspace: custom activities and adjustments
route('POST', '/projects/:id/boq/items', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role)) throw new HttpError(403, 'forbidden', tr('engine.errors.cannotEditBoq'))
  const project = projectFor(user, params.id)
  const input = BoqCustomItemInputSchema.parse(body)
  const meta = metaFor(project.id)
  if (meta.status === 'issued') throw new HttpError(409, 'boq_issued', tr('engine.errors.boqIssued'))
  meta.customItems = [
    ...(meta.customItems ?? []),
    { ...input, id: uid('item'), createdBy: user.name, createdAt: nowIso() },
  ]
  logActivity({
    type: 'boq_override',
    projectId: project.id,
    projectName: project.name,
    messageKey: 'engine.activity.activityAdded',
    messageParams: { description: input.description },
    actor: user.name,
  })
  save()
  return boqFor(project)
})
route('DELETE', '/projects/:id/boq/items/:itemId', ({ headers, params }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role)) throw new HttpError(403, 'forbidden', tr('engine.errors.cannotEditBoq'))
  const project = projectFor(user, params.id)
  const meta = metaFor(project.id)
  const id = decodeURIComponent(params.itemId)
  if (!(meta.customItems ?? []).some((c) => c.id === id))
    throw new HttpError(404, 'item_not_found', tr('engine.errors.itemNotFound'))
  meta.customItems = (meta.customItems ?? []).filter((c) => c.id !== id)
  delete db.overrides[id]
  save()
  return boqFor(project)
})
route('PUT', '/projects/:id/boq/adjustments', ({ headers, params, body }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role)) throw new HttpError(403, 'forbidden', tr('engine.errors.cannotEditBoq'))
  const project = projectFor(user, params.id)
  const meta = metaFor(project.id)
  meta.adjustments = BoqAdjustmentsSchema.parse(body)
  logActivity({
    type: 'boq_override',
    projectId: project.id,
    projectName: project.name,
    messageKey: 'engine.activity.adjustmentsSet',
    messageParams: {
      overhead: meta.adjustments.overheadPct,
      contingency: meta.adjustments.contingencyPct,
      vat: meta.adjustments.vatPct,
    },
    actor: user.name,
  })
  save()
  return boqFor(project)
})

// BOQ index and dashboard
route('GET', '/boqs', ({ headers }) => {
  const user = requireUser(headers)
  if (!PRO_ROLES.has(user.role) && user.role !== 'pm')
    throw new HttpError(403, 'forbidden', tr('engine.errors.professionalRequired'))
  const out = visibleProjects(user).map((p) => {
    const b = boqFor(p)
    return {
      projectId: p.id,
      projectName: p.name,
      locationName: p.locationName,
      version: b.version,
      status: b.status,
      grandTotal: b.grandTotal,
      itemCount: b.bills.reduce((a, x) => a + x.items.length, 0),
      blocked: b.exportBlockedReasons.length > 0,
      updatedAt: p.updatedAt,
    }
  })
  return out
})
route('GET', '/dashboard', ({ headers }) => {
  const user = requireUser(headers)
  const projects = visibleProjects(user)
    .map(withLatest)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const pro = PRO_ROLES.has(user.role) || user.role === 'pm'
  const boqs = pro ? projects.map((p) => ({ p, b: boqFor(p) })) : []
  const visibleIds = new Set(projects.map((p) => p.id))
  const dash = {
    activeProjects: projects.filter((p) => p.status !== 'archived').length,
    totalEstimatedValue: projects.reduce((a, p) => a + (p.latestTotalMid ?? 0), 0),
    draftEstimates: projects.filter((p) => p.estimateClass <= 1 || p.status === 'draft').length,
    issuedBoqs: boqs.filter((x) => x.b.status === 'issued').length,
    boqsInReview: boqs.filter((x) => x.b.status === 'review').length,
    blockedExports: boqs.filter((x) => x.b.exportBlockedReasons.length > 0).length,
    pendingPrices:
      user.role === 'platform_admin'
        ? db.prices.filter((p) => p.status === 'pending' || p.status === 'flagged').length
        : 0,
    recentProjects: projects.slice(0, 6),
    valueByProject: projects
      .filter((p) => p.latestTotalMid)
      .map((p) => ({ id: p.id, name: p.name, total: p.latestTotalMid ?? 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
    activity: db.activity
      .filter((a) => !a.projectId || visibleIds.has(a.projectId) || user.role === 'platform_admin')
      .slice(0, 12)
      .map(renderActivity),
  }
  return dash
})

// Platform configuration (platform admin)
route('GET', '/admin/config', ({ headers }) => {
  const user = requireUser(headers)
  if (user.role !== 'platform_admin') throw new HttpError(403, 'forbidden', tr('engine.errors.platformAdminsOnly'))
  return db.config
})
route('PUT', '/admin/config', ({ headers, body }) => {
  const user = requireUser(headers)
  if (user.role !== 'platform_admin') throw new HttpError(403, 'forbidden', tr('engine.errors.platformAdminsOnly'))
  const input = SaveConfigSchema.parse(body)
  const shareSum = input.config.packages.reduce((a, p) => a + p.share, 0)
  if (Math.abs(shareSum - 1) > 0.02)
    throw new HttpError(
      422,
      'validation_error',
      tr('engine.errors.sharesMustSum', { pct: (shareSum * 100).toFixed(1) }),
    )
  if (!input.config.locations.some((l) => l.enabled))
    throw new HttpError(422, 'validation_error', tr('engine.errors.locationRequired'))
  if (!input.config.typologies.some((t) => t.enabled))
    throw new HttpError(422, 'validation_error', tr('engine.errors.typologyRequired'))
  const version = db.config.version + 1
  const at = nowIso()
  db.config = PlatformConfigSchema.parse({
    ...input.config,
    version,
    updatedAt: at,
    updatedBy: user.name,
    changelog: [{ version, at, by: user.name, note: input.note }, ...db.config.changelog].slice(0, 50),
  })
  traces.clear()
  logActivity({
    type: 'project_updated',
    projectId: null,
    projectName: null,
    messageKey: 'engine.activity.configPublished',
    messageParams: { version, note: input.note },
    actor: user.name,
  })
  save()
  return db.config
})
route('POST', '/admin/config/reset', ({ headers }) => {
  const user = requireUser(headers)
  if (user.role !== 'platform_admin') throw new HttpError(403, 'forbidden', tr('engine.errors.platformAdminsOnly'))
  const version = db.config.version + 1
  const at = nowIso()
  db.config = {
    ...structuredClone(DEFAULT_CONFIG),
    version,
    updatedAt: at,
    updatedBy: user.name,
    changelog: [{ version, at, by: user.name, note: tr('engine.config.resetNote') }, ...db.config.changelog].slice(
      0,
      50,
    ),
  }
  traces.clear()
  save()
  return db.config
})

/* ---------- Dispatcher ---------- */
export async function mockFetch(method, url, body, headers) {
  const [pathPart, queryPart] = url.split('?')
  const path = (pathPart ?? '').replace(/^\/api/, '')
  const query = new URLSearchParams(queryPart ?? '')
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180))
  lang = langFromHeaders(headers)
  for (const r of routes) {
    if (r.method !== method.toUpperCase()) continue
    const m = r.pattern.exec(path)
    if (!m) continue
    const params = {}
    r.keys.forEach((k, i) => (params[k] = m[i + 1] ?? ''))
    try {
      return { status: 200, body: r.handler({ params, query, body, headers, lang }) }
    } catch (e) {
      if (e instanceof HttpError)
        return { status: e.status, body: { code: e.code, message: e.message, details: e.details } }
      if (e && typeof e === 'object' && 'issues' in e)
        return {
          status: 422,
          body: { code: 'validation_error', message: tr('engine.errors.invalidInput'), details: e.issues },
        }
      return { status: 500, body: { code: 'internal', message: e.message } }
    }
  }
  return { status: 404, body: { code: 'not_found', message: tr('engine.errors.noRoute', { method, path }) } }
}
