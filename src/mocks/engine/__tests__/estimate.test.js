import { describe, expect, it } from 'vitest'
import { runEstimate, hashParams } from '../estimate'
import { DEFAULT_CONFIG, rulesFromConfig } from '../rules'
import { reverseBudget, stageReach, costToComplete, generateBoq } from '../views'
import { LOCATIONS, PRICES } from '@/mocks/data'

import { BoqSchema, EstimateResultSchema, QUALITY_LEVELS } from '@/shared/api/schemas'

const base = {
  typology: 'house',
  locationId: 'kigali',
  gfa: 180,
  storeys: 1,
  bedrooms: 3,
  bathrooms: 2,
  rooms: { garage: false, office: false, store: false, separateKitchen: false },
  quality: 'STD',
  elementOverrides: {},
  features: [],
  site: { ownsLand: true, plotSizeM2: 600, sloping: 'flat' },
  budget: null,
  targetCompletionMonths: null,
  requestedClass: 1,
}

describe('mock estimate engine', () => {
  it('is deterministic: same params → same id and totals', () => {
    const a = runEstimate(base, LOCATIONS).result
    const b = runEstimate({ ...base }, LOCATIONS).result
    expect(a.id).toBe(b.id)
    expect(a.total).toEqual(b.total)
    expect(hashParams(base)).toBe(hashParams({ ...base }))
  })

  it('produces output that satisfies the API schema', () => {
    const { result } = runEstimate(base, LOCATIONS)
    expect(() => EstimateResultSchema.parse(result)).not.toThrow()
  })

  it('labels Level 1 as "Rough budget" and never as a BOQ', () => {
    const { result } = runEstimate(base, LOCATIONS)
    expect(result.estimateClass).toBe(1)
    expect(result.classLabel).toBe('Rough budget')
    expect(result.classLabel.toLowerCase()).not.toContain('boq')
  })

  it('range brackets the most-likely value and widens for lower classes', () => {
    const l1 = runEstimate(base, LOCATIONS).result
    const l2 = runEstimate({ ...base, requestedClass: 2 }, LOCATIONS).result
    expect(l1.total.low).toBeLessThan(l1.total.mid)
    expect(l1.total.high).toBeGreaterThan(l1.total.mid)
    const width = (r) => (r.high - r.low) / r.mid
    expect(width(l1.total)).toBeGreaterThan(width(l2.total))
  })

  it('property: increasing GFA never reduces the total', () => {
    let prev = 0
    for (const gfa of [40, 80, 120, 180, 260, 400, 800, 1500]) {
      const t = runEstimate({ ...base, gfa }, LOCATIONS).result.total.mid
      expect(t).toBeGreaterThanOrEqual(prev)
      prev = t
    }
  })

  it('property: ECO ≤ STD ≤ PRM ≤ LUX for every element', () => {
    const results = Object.fromEntries(
      QUALITY_LEVELS.map((q) => [q, runEstimate({ ...base, quality: q }, LOCATIONS).result]),
    )
    for (const group of results.STD.elements.map((e) => e.group)) {
      const amt = (q) => results[q].elements.find((e) => e.group === group)?.amount ?? 0
      expect(amt('ECO')).toBeLessThanOrEqual(amt('STD'))
      expect(amt('STD')).toBeLessThanOrEqual(amt('PRM'))
      expect(amt('PRM')).toBeLessThanOrEqual(amt('LUX'))
    }
    expect(results.ECO.total.mid).toBeLessThan(results.STD.total.mid)
    expect(results.PRM.total.mid).toBeLessThan(results.LUX.total.mid)
  })

  it('phase table sums to the most-likely total and percentages ≈ 100', () => {
    const { result } = runEstimate(base, LOCATIONS)
    const sum = result.phases.reduce((a, p) => a + p.amount, 0)
    expect(Math.abs(sum - result.total.mid)).toBeLessThan(result.phases.length) // rounding only
    const pct = result.phases.reduce((a, p) => a + p.pct, 0)
    expect(pct).toBeGreaterThan(99)
    expect(pct).toBeLessThan(101)
  })

  it('every displayed figure has a trace node', () => {
    const { result, trace } = runEstimate({ ...base, features: ['solar'] }, LOCATIONS)
    expect(trace.get(result.totalFigureId)).toBeDefined()
    for (const p of result.phases) expect(trace.get(p.figureId)).toBeDefined()
    for (const e of result.elements) expect(trace.get(e.figureId)).toBeDefined()
    expect(trace.get(result.totalFigureId).children.length).toBeGreaterThan(0)
  })

  it('changing floor quality changes the floors element and the total consistently', () => {
    const std = runEstimate(base, LOCATIONS).result
    const prm = runEstimate({ ...base, elementOverrides: { floors: 'PRM' } }, LOCATIONS).result
    const floors = (r) => r.elements.find((e) => e.group === 'floors').amount
    expect(floors(prm)).toBeGreaterThan(floors(std))
    expect(prm.total.mid).toBeGreaterThan(std.total.mid)
    expect(prm.warnings.some((w) => w.code === 'stale_price' && w.blocksProfessionalExport)).toBe(true)
  })

  it('applies the location factor', () => {
    const kigali = runEstimate(base, LOCATIONS).result.total.mid
    const rusizi = runEstimate({ ...base, locationId: 'rusizi' }, LOCATIONS).result.total.mid
    expect(rusizi / kigali).toBeCloseTo(1.15, 1)
  })

  it('downgrades Level 3+ requests to Level 2 with a warning', () => {
    const { result } = runEstimate({ ...base, requestedClass: 3 }, LOCATIONS)
    expect(result.estimateClass).toBe(2)
    expect(result.warnings.some((w) => w.code === 'downgraded_class')).toBe(true)
  })
})

describe('views over the estimate model', () => {
  it('reverse budget returns 2–4 options re-validated within ±1 % of budget (or shows completion %)', () => {
    const res = reverseBudget(
      { budget: 80_000_000, locationId: 'kigali', typology: 'house', ownsLand: true },
      LOCATIONS,
    )
    expect(res.options.length).toBeGreaterThanOrEqual(2)
    expect(res.options.length).toBeLessThanOrEqual(4)
    for (const o of res.options) {
      if (o.completionPct >= 100) expect(Math.abs(o.budgetDeviationPct)).toBeLessThanOrEqual(1)
      const forward = runEstimate(o.params, LOCATIONS).result
      expect(forward.total.mid).toBe(o.total.mid)
    }
  })

  it('stage reach funds phases in order and reports the next 25 %', () => {
    const est = runEstimate(base, LOCATIONS).result
    const r = stageReach(est, est.total.mid * 0.4)
    const statuses = r.stages.map((s) => s.status)
    const firstUnfunded = statuses.indexOf('unfunded')
    expect(statuses.slice(0, Math.max(0, statuses.indexOf('partial')))).not.toContain('unfunded')
    if (firstUnfunded >= 0) expect(statuses.slice(firstUnfunded)).not.toContain('complete')
    expect(r.overallPct).toBe(40)
    expect(r.nextQuarterCost).toBe(Math.round(est.total.mid * 0.25))
  })

  it('cost to complete: remaining + spent = forecast; full progress leaves nothing', () => {
    const est = runEstimate(base, LOCATIONS).result
    const half = costToComplete(
      { params: base, phaseProgress: { P0: 100, P1: 100, P2: 50 }, amountSpent: 10_000_000 },
      est,
    )
    expect(half.forecastTotal.mid).toBe(half.amountSpent + half.remainingCost.mid)
    const all = Object.fromEntries(est.phases.map((p) => [p.code, 100]))
    const done = costToComplete({ params: base, phaseProgress: all, amountSpent: 0 }, est)
    expect(done.remainingCost.mid).toBe(0)
  })

  it('BOQ amounts = qty × (1 + waste) × rate; stale prices block export', () => {
    const est = runEstimate({ ...base, requestedClass: 4 }, LOCATIONS).result
    const boq = generateBoq(est, PRICES, {})
    expect(() => BoqSchema.parse(boq)).not.toThrow()
    for (const item of boq.bills.flatMap((b) => b.items)) {
      expect(item.amount).toBe(Math.round(item.qty * (1 + item.wastePct / 100) * item.rate))
    }
    expect(boq.grandTotal).toBe(boq.measuredSubtotal + boq.contingency + boq.vat)
    const stalePrices = PRICES.map((p) => (p.materialId === 'MAT-CEM-0001' ? { ...p, sourceDate: '2025-01-01' } : p))
    const blocked = generateBoq(est, stalePrices, {})
    expect(blocked.exportBlockedReasons.length).toBeGreaterThan(0)
  })

  it('BOQ overrides change quantity, mark the source manual and keep the reason', () => {
    const est = runEstimate({ ...base, requestedClass: 4 }, LOCATIONS).result
    const key = `${est.id}:5.01`
    const boq = generateBoq(est, PRICES, {
      [key]: {
        qty: 999,
        rate: null,
        wastePct: null,
        reason: 'Measured from drawings',
        changedBy: 'QS',
        changedAt: '2026-10-10T00:00:00Z',
      },
    })
    const item = boq.bills.flatMap((b) => b.items).find((i) => i.code === '5.01')
    expect(item.qty).toBe(999)
    expect(item.qtySource).toBe('manual')
    expect(item.override?.reason).toBe('Measured from drawings')
  })
})

describe('engine prose follows the rules language', () => {
  const fr = rulesFromConfig(DEFAULT_CONFIG, 'fr')
  const rw = rulesFromConfig(DEFAULT_CONFIG, 'rw')
  const params = { ...base, requestedClass: 3, elementOverrides: { floors: 'PRM' }, features: ['solar'] }

  it('keeps ids and figures language-independent and never leaks dictionary keys', () => {
    const en = runEstimate(params, LOCATIONS)
    for (const rules of [fr, rw]) {
      const { result, trace } = runEstimate(params, LOCATIONS, rules)
      expect(result.id).toBe(en.result.id)
      expect(result.total).toEqual(en.result.total)
      expect(JSON.stringify({ result, trace: [...trace.values()] })).not.toMatch(/"engine\./)
      const boq = generateBoq(
        runEstimate({ ...base, requestedClass: 4 }, LOCATIONS, rules).result,
        PRICES,
        {},
        undefined,
        rules,
      )
      expect(JSON.stringify(boq)).not.toMatch(/"engine\./)
    }
  })

  it('English text is unchanged', () => {
    const { result, trace } = runEstimate(params, LOCATIONS)
    expect(result.assumptions.find((a) => a.key === 'prelims').text).toBe(
      'Preliminaries spread pro-rata over the programme.',
    )
    expect(result.assumptions.find((a) => a.key === 'storeys').text).toBe(
      '1 storey(s); frame cost +4 % per additional storey.',
    )
    expect(result.warnings.find((w) => w.code === 'downgraded_class').message).toBe(
      'Design-stage estimates need plans or measured quantities. Shown as a preliminary estimate.',
    )
    expect(trace.get(result.totalFigureId).label).toBe('Total project cost (most likely)')
    expect(trace.get(`${result.id}:feature:solar`).formula).toBe('fixed allowance × location factor')
  })

  it('returns French assumptions, warnings, trace labels, reverse-budget options and BOQ items', () => {
    const { result, trace } = runEstimate(params, LOCATIONS, fr)
    expect(result.assumptions.find((a) => a.key === 'prelims').text).toBe(
      'Installations de chantier réparties au prorata sur le programme.',
    )
    expect(result.warnings.find((w) => w.code === 'downgraded_class').message).toMatch(/estimation préliminaire/)
    expect(result.warnings.find((w) => w.code === 'stale_price').message).toContain('MAT-TIL-0021')
    expect(trace.get(result.totalFigureId).label).toBe('Coût total du projet (le plus probable)')
    expect(trace.get(`${result.id}:phase:P2`).label).toBe('Fondations (P2)')
    const rev = reverseBudget(
      { budget: 80_000_000, locationId: 'kigali', typology: 'house', ownsLand: true },
      LOCATIONS,
      fr,
    )
    expect(rev.options[0].title).toBe('Compacte et économique')
    const boq = generateBoq(
      runEstimate({ ...base, requestedClass: 4 }, LOCATIONS, fr).result,
      PRICES,
      {},
      undefined,
      fr,
    )
    const item = boq.bills.flatMap((b) => b.items).find((i) => i.code === '5.01')
    expect(item.description).toBe('Murs extérieurs, blocs creux 200 mm')
    expect(item.trade).toBe('Maçonnerie')
    expect(item.formula).toBe('périmètre × hauteur − ouvertures')
  })
})
