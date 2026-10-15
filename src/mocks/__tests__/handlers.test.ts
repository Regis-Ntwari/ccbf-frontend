import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch, parseIntent, resetMockDb } from '../handlers'

const auth = async (email: string) => {
  const res = await mockFetch('POST', '/auth/otp/verify', { identifier: email, code: '123456' }, {})
  return { Authorization: `Bearer ${(res.body as { token: string }).token}` }
}

beforeEach(() => resetMockDb())

describe('natural-language parser (rules)', () => {
  it('extracts typology, bedrooms, area, storeys, location and features', () => {
    const r = parseIntent('A 3-bedroom house in Musanze, 180 m², two storeys with solar and a boundary wall')
    expect(r.extracted).toMatchObject({ typology: 'house', bedrooms: 3, gfa: 180, storeys: 2, locationId: 'musanze', features: ['solar', 'boundaryWall'] })
    expect(r.missing).toEqual([])
    expect(r.provenance).toBe('rules')
  })
  it('asks for at most three missing essentials', () => {
    const r = parseIntent('something nice')
    expect(r.missing.length).toBeLessThanOrEqual(3)
  })
  it('understands French and Kinyarwanda keywords', () => {
    expect(parseIntent('Une maison de 4 chambres à Kigali').extracted.typology).toBe('house')
    expect(parseIntent('Inzu y ibyumba 2 i Huye').extracted).toMatchObject({ typology: 'house', bedrooms: 2, locationId: 'huye' })
  })
})

describe('mock API', () => {
  it('runs an estimate idempotently and serves traces', async () => {
    const params = { typology: 'house', locationId: 'kigali', gfa: 120, storeys: 1 }
    const a = await mockFetch('POST', '/estimates', params, {})
    const b = await mockFetch('POST', '/estimates', params, {})
    expect(a.status).toBe(200)
    const est = a.body as { id: string; totalFigureId: string }
    expect((b.body as { id: string }).id).toBe(est.id)
    const trace = await mockFetch('GET', `/estimates/${est.id}/trace/${encodeURIComponent(est.totalFigureId)}`, undefined, {})
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
    const ids = (mine.body as { items: { id: string }[] }).items.map((p) => p.id)
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
    const prices = (await mockFetch('GET', '/catalogue/prices?status=approved', undefined, admin)).body as { id: string; materialId: string }[]
    const cement = prices.find((p) => p.materialId === 'MAT-CEM-0001')!
    await mockFetch('POST', `/catalogue/prices/${cement.id}/decision`, { decision: 'reject' }, admin)
    const after = (await mockFetch('GET', '/projects/prj_nyarugenge/boq', undefined, qs)).body as { exportBlockedReasons: string[] }
    expect(after.exportBlockedReasons.length).toBeGreaterThan(0)
    const exp = await mockFetch('POST', '/projects/prj_nyarugenge/boq/export', { format: 'csv' }, qs)
    expect(exp.status).toBe(409)
  })
  it('records overrides with the author and reason', async () => {
    const qs = await auth('qs@demo.rw')
    const boq = (await mockFetch('GET', '/projects/prj_nyarugenge/boq', undefined, qs)).body as { bills: { items: { id: string }[] }[] }
    const item = boq.bills[1]!.items[0]!
    const r = await mockFetch('PUT', `/projects/prj_nyarugenge/boq/items/${encodeURIComponent(item.id)}/override`, { qty: 42, reason: 'Site measurement' }, qs)
    expect(r.status).toBe(200)
    const updated = (r.body as { bills: { items: { id: string; qty: number; override: { changedBy: string } }[] }[] }).bills.flatMap((b) => b.items).find((i) => i.id === item.id)!
    expect(updated.qty).toBe(42)
    expect(updated.override.changedBy).toBe('Jean Habimana')
  })
  it('only platform admins approve global prices; approval supersedes the old record', async () => {
    const qs = await auth('qs@demo.rw')
    expect((await mockFetch('POST', '/catalogue/prices/pr_101/decision', { decision: 'approve' }, qs)).status).toBe(403)
    const admin = await auth('admin@demo.rw')
    expect((await mockFetch('POST', '/catalogue/prices/pr_101/decision', { decision: 'approve' }, admin)).status).toBe(200)
    const approved = (await mockFetch('GET', '/catalogue/prices?status=approved&q=MAT-CEM-0001', undefined, admin)).body as { id: string; locationId: string }[]
    expect(approved.filter((p) => p.locationId === 'kigali').map((p) => p.id)).toEqual(['pr_101'])
  })
})
