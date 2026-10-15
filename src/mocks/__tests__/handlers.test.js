import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch, parseIntent, resetMockDb } from '../handlers'

const auth = async (email) => {
  const res = await mockFetch('POST', '/auth/otp/verify', { identifier: email, code: '123456' }, {})
  return { Authorization: `Bearer ${res.body.token}` }
}

beforeEach(() => resetMockDb())

describe('natural-language parser (rules)', () => {
  it('extracts typology, bedrooms, area, storeys, location and features', () => {
    const r = parseIntent('A 3-bedroom house in Musanze, 180 m², two storeys with solar and a boundary wall')
    expect(r.extracted).toMatchObject({
      typology: 'house',
      bedrooms: 3,
      gfa: 180,
      storeys: 2,
      locationId: 'musanze',
      features: ['solar', 'boundaryWall'],
    })
    expect(r.missing).toEqual([])
    expect(r.provenance).toBe('rules')
  })
  it('asks for at most three missing essentials', () => {
    const r = parseIntent('something nice')
    expect(r.missing.length).toBeLessThanOrEqual(3)
  })
  it('understands French and Kinyarwanda keywords', () => {
    expect(parseIntent('Une maison de 4 chambres à Kigali').extracted.typology).toBe('house')
    expect(parseIntent('Inzu y ibyumba 2 i Huye').extracted).toMatchObject({
      typology: 'house',
      bedrooms: 2,
      locationId: 'huye',
    })
  })
})

describe('mock API', () => {
  it('runs an estimate idempotently and serves traces', async () => {
    const params = { typology: 'house', locationId: 'kigali', gfa: 120, storeys: 1 }
    const a = await mockFetch('POST', '/estimates', params, {})
    const b = await mockFetch('POST', '/estimates', params, {})
    expect(a.status).toBe(200)
    const est = a.body
    expect(b.body.id).toBe(est.id)
    const trace = await mockFetch(
      'GET',
      `/estimates/${est.id}/trace/${encodeURIComponent(est.totalFigureId)}`,
      undefined,
      {},
    )
    expect(trace.status).toBe(200)
  })
  it('validates input with 422', async () => {
    const r = await mockFetch('POST', '/estimates', { typology: 'castle' }, {})
    expect(r.status).toBe(422)
  })
  it('enforces tenant isolation on projects', async () => {
    const client = await auth('client@demo.rw')
    const qs = await auth('qs@demo.rw')
    const mine = await mockFetch('GET', '/projects', undefined, client)
    const ids = mine.body.items.map((p) => p.id)
    expect(ids).toContain('prj_kicukiro')
    expect(ids).not.toContain('prj_nyarugenge')
    const cross = await mockFetch('GET', '/projects/prj_kicukiro', undefined, qs)
    expect(cross.status).toBe(404)
    expect((await mockFetch('GET', '/projects', undefined, {})).status).toBe(401)
  })
  it('blocks BOQ for clients and blocks export when prices are stale', async () => {
    const client = await auth('client@demo.rw')
    expect((await mockFetch('GET', '/projects/prj_kicukiro/boq', undefined, client)).status).toBe(403)
    const qs = await auth('qs@demo.rw')
    const boq = await mockFetch('GET', '/projects/prj_nyarugenge/boq', undefined, qs)
    expect(boq.status).toBe(200)
    const admin = await auth('admin@demo.rw')
    // Approve the stale-dated porcelain submission? No: reject fresh cement so only stale ones remain → blocked.
    const prices = (await mockFetch('GET', '/catalogue/prices?status=approved', undefined, admin)).body
    const cement = prices.find((p) => p.materialId === 'MAT-CEM-0001')
    await mockFetch('POST', `/catalogue/prices/${cement.id}/decision`, { decision: 'reject' }, admin)
    const after = (await mockFetch('GET', '/projects/prj_nyarugenge/boq', undefined, qs)).body
    expect(after.exportBlockedReasons.length).toBeGreaterThan(0)
    const exp = await mockFetch('POST', '/projects/prj_nyarugenge/boq/export', { format: 'csv' }, qs)
    expect(exp.status).toBe(409)
  })
  it('records overrides with the author and reason', async () => {
    const qs = await auth('qs@demo.rw')
    const boq = (await mockFetch('GET', '/projects/prj_nyarugenge/boq', undefined, qs)).body
    const item = boq.bills[1].items[0]
    const r = await mockFetch(
      'PUT',
      `/projects/prj_nyarugenge/boq/items/${encodeURIComponent(item.id)}/override`,
      { qty: 42, reason: 'Site measurement' },
      qs,
    )
    expect(r.status).toBe(200)
    const updated = r.body.bills.flatMap((b) => b.items).find((i) => i.id === item.id)
    expect(updated.qty).toBe(42)
    expect(updated.override.changedBy).toBe('Jean Habimana')
  })
  it('only platform admins approve global prices; approval supersedes the old record', async () => {
    const qs = await auth('qs@demo.rw')
    expect((await mockFetch('POST', '/catalogue/prices/pr_101/decision', { decision: 'approve' }, qs)).status).toBe(403)
    const admin = await auth('admin@demo.rw')
    expect((await mockFetch('POST', '/catalogue/prices/pr_101/decision', { decision: 'approve' }, admin)).status).toBe(
      200,
    )
    const approved = (await mockFetch('GET', '/catalogue/prices?status=approved&q=MAT-CEM-0001', undefined, admin)).body
    expect(approved.filter((p) => p.locationId === 'kigali').map((p) => p.id)).toEqual(['pr_101'])
  })
})

describe('estimation workspace endpoints', () => {
  it('adds and removes a custom activity and applies adjustments', async () => {
    const qs = await auth('qs@demo.rw')
    const before = (await mockFetch('GET', '/projects/prj_nyarugenge/boq', undefined, qs)).body
    const added = await mockFetch(
      'POST',
      '/projects/prj_nyarugenge/boq/items',
      { billCode: '13', description: 'Septic tank 10 m³', unit: 'no.', qty: 1, rate: 2_500_000 },
      qs,
    )
    expect(added.status).toBe(200)
    const after = added.body
    expect(after.measuredSubtotal - before.measuredSubtotal).toBe(2_500_000)
    const item = after.bills.flatMap((b) => b.items).find((i) => i.custom)
    const adj = await mockFetch(
      'PUT',
      '/projects/prj_nyarugenge/boq/adjustments',
      { overheadPct: 10, contingencyPct: 5, vatPct: 18 },
      qs,
    )
    const b = adj.body
    expect(b.overhead).toBe(Math.round(b.measuredSubtotal * 0.1))
    expect(b.grandTotal).toBe(b.measuredSubtotal + b.overhead + b.contingency + b.vat)
    const removed = await mockFetch(
      'DELETE',
      `/projects/prj_nyarugenge/boq/items/${encodeURIComponent(item.id)}`,
      undefined,
      qs,
    )
    expect(removed.body.bills.flatMap((x) => x.items).some((i) => i.custom)).toBe(false)
    expect(
      (
        await mockFetch(
          'DELETE',
          `/projects/prj_nyarugenge/boq/items/${encodeURIComponent(before.bills[0].items[0].id)}`,
          undefined,
          qs,
        )
      ).status,
    ).toBe(404)
  })
  it('serves a tenant-scoped dashboard and BOQ index', async () => {
    const client = await auth('client@demo.rw')
    const dash = await mockFetch('GET', '/dashboard', undefined, client)
    expect(dash.status).toBe(200)
    const d = dash.body
    expect(d.recentProjects.map((p) => p.id)).toEqual(['prj_kicukiro'])
    expect(d.activity.every((a) => !a.projectId || a.projectId === 'prj_kicukiro')).toBe(true)
    expect((await mockFetch('GET', '/boqs', undefined, client)).status).toBe(403)
    const qs = await auth('qs@demo.rw')
    const boqs = (await mockFetch('GET', '/boqs', undefined, qs)).body
    expect(boqs.map((b) => b.projectId)).toEqual(['prj_nyarugenge'])
  })
})

describe('platform configuration', () => {
  it('serves a public subset without rates and a full config to platform admins only', async () => {
    const pub = await mockFetch('GET', '/config', undefined, {})
    expect(pub.status).toBe(200)
    const p = pub.body
    expect(p.typologies[0]).not.toHaveProperty('baseRatePerM2')
    expect(p.branding.shortName).toBe('CostBOQ')
    const qs = await auth('qs@demo.rw')
    expect((await mockFetch('GET', '/admin/config', undefined, qs)).status).toBe(403)
    const admin = await auth('admin@demo.rw')
    expect((await mockFetch('GET', '/admin/config', undefined, admin)).status).toBe(200)
  })
  it('publishing a version changes engine output, labels and estimate ids; shares are validated', async () => {
    const admin = await auth('admin@demo.rw')
    const cfg = (await mockFetch('GET', '/admin/config', undefined, admin)).body
    const params = { typology: 'house', locationId: 'kigali', gfa: 100, storeys: 1 }
    const before = (await mockFetch('POST', '/estimates', params, {})).body
    const { version: _v, updatedAt: _a, updatedBy: _b, changelog: _c, ...editable } = cfg
    const next = {
      ...editable,
      homepage: { ...cfg.homepage, headline: { en: 'Build with certainty.', fr: 'Construire avec certitude.' } },
      typologies: cfg.typologies.map((t) => (t.id === 'house' ? { ...t, baseRatePerM2: t.baseRatePerM2 * 2 } : t)),
    }
    const saved = await mockFetch('PUT', '/admin/config', { config: next, note: 'Double house base rate' }, admin)
    expect(saved.status).toBe(200)
    expect(saved.body.version).toBe(cfg.version + 1)
    const after = (await mockFetch('POST', '/estimates', params, {})).body
    expect(after.id).not.toBe(before.id)
    expect(after.rulesVersion).not.toBe(before.rulesVersion)
    expect(after.total.mid).toBeGreaterThan(before.total.mid * 1.8)
    const pub = (await mockFetch('GET', '/config', undefined, {})).body
    expect(pub.homepage.headline).toBe('Build with certainty.')
    // Text is resolved per request language; a missing translation (rw) falls back to English.
    const fr = (await mockFetch('GET', '/config', undefined, { 'Accept-Language': 'fr' })).body
    expect(fr.homepage.headline).toBe('Construire avec certitude.')
    expect(fr.typologies.find((t) => t.id === 'house').label).toBe('Maison')
    const rw = (await mockFetch('GET', '/config', undefined, { 'Accept-Language': 'rw' })).body
    expect(rw.homepage.headline).toBe('Build with certainty.')
    expect(rw.typologies.find((t) => t.id === 'house').label).toBe('Inzu')
    const frEstimate = (await mockFetch('POST', '/estimates', params, { 'Accept-Language': 'fr' })).body
    expect(frEstimate.id).toBe(after.id)
    expect(frEstimate.phases.find((ph) => ph.code === 'P2').name).toBe('Fondations')
    // Admin saves with a plain string instead of a localized text: rejected.
    const plain = { ...next, homepage: { ...next.homepage, headline: 'plain string' } }
    expect((await mockFetch('PUT', '/admin/config', { config: plain, note: 'bad shape' }, admin)).status).toBe(422)
    const bad = { ...next, packages: cfg.packages.map((p, i) => (i === 0 ? { ...p, share: p.share + 0.5 } : p)) }
    expect((await mockFetch('PUT', '/admin/config', { config: bad, note: 'broken shares' }, admin)).status).toBe(422)
    void _v
    void _a
    void _b
    void _c
  })
})

describe('request language (Accept-Language)', () => {
  it('serves assumptions, warnings, errors, hints and the activity log in French', async () => {
    const fr = { 'Accept-Language': 'fr' }
    const params = { typology: 'house', locationId: 'kigali', gfa: 120, storeys: 1, requestedClass: 3 }
    const en = (await mockFetch('POST', '/estimates', params, {})).body
    const est = (await mockFetch('POST', '/estimates', params, fr)).body
    expect(est.id).toBe(en.id)
    expect(est.assumptions.find((a) => a.key === 'exclusions').text).toBe(
      'Hors achat du terrain, frais financiers, mobilier et équipements mobiles.',
    )
    expect(est.warnings.find((w) => w.code === 'downgraded_class').message).toMatch(/estimation préliminaire/)
    expect((await mockFetch('GET', '/projects', undefined, fr)).body.message).toBe('Connectez-vous pour continuer')
    expect((await mockFetch('GET', '/projects', undefined, {})).body.message).toBe('Sign in to continue')
    expect((await mockFetch('POST', '/auth/otp/request', { identifier: 'nobody@example.com' }, fr)).body.hint).toMatch(
      /^Utilisateur inconnu/,
    )
    expect((await mockFetch('GET', '/nowhere', undefined, fr)).body.message).toBe('Aucune route GET /nowhere')
  })

  it('renders stored activity in the language of the reader, not the writer', async () => {
    const client = await auth('client@demo.rw')
    await mockFetch('PATCH', '/projects/prj_kicukiro', { status: 'active' }, client)
    const dashEn = (await mockFetch('GET', '/dashboard', undefined, client)).body
    expect(dashEn.activity[0].message).toBe('Status set to active')
    expect(dashEn.activity.map((a) => a.message)).toContain('Promoted to Level 2 (preliminary estimate)')
    const dashFr = (await mockFetch('GET', '/dashboard', undefined, { ...client, 'Accept-Language': 'fr' })).body
    expect(dashFr.activity[0].message).toBe('Statut défini sur active')
    expect(dashFr.activity.map((a) => a.message)).toContain('Promu au niveau 2 (estimation préliminaire)')
    expect(JSON.stringify(dashFr)).not.toMatch(/"engine\./)
  })
})
