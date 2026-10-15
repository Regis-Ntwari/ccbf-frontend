import i18n from '@/shared/i18n'

import { DEFAULT_RULES } from './rules'

import { hashParams, runEstimate, runTotal } from './estimate'

const round = (n) => Math.round(n)

/* ---------------- Reverse budget (J2) ---------------- */

/** Bisection on GFA so the forward engine lands within ±1 % of the budget. */
function solveGfa(base, budget, locations, rules) {
  let lo = 20
  let hi = 5000
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const t = runTotal({ ...base, gfa: mid }, locations, rules).totalMid
    if (t > budget) hi = mid
    else lo = mid
  }
  return Math.floor(lo)
}

export function reverseBudget(req, locations, rules = DEFAULT_RULES) {
  const t = i18n.getFixedT(rules.lang ?? 'en')
  const baseParams = {
    typology: req.typology,
    locationId: req.locationId,
    gfa: 100,
    storeys: 1,
    bedrooms: 3,
    bathrooms: 2,
    rooms: { garage: false, office: false, store: false, separateKitchen: false },
    quality: 'STD',
    elementOverrides: {},
    features: req.ownsLand ? [] : [],
    site: { ownsLand: req.ownsLand, plotSizeM2: null, sloping: 'unknown' },
    budget: req.budget,
    targetCompletionMonths: null,
    requestedClass: 1,
  }
  const candidates = [
    {
      key: 'compact',
      quality: 'ECO',
      storeys: 1,
      features: [],
    },
    {
      key: 'standard',
      quality: 'STD',
      storeys: 1,
      features: ['boundaryWall'],
    },
    {
      key: 'twoStorey',
      quality: 'STD',
      storeys: 2,
      features: [],
    },
    {
      key: 'premium',
      quality: 'PRM',
      storeys: 1,
      features: ['solar'],
    },
  ]
  const options = candidates.map((c, i) => {
    const p = { ...baseParams, quality: c.quality, storeys: c.storeys, features: c.features }
    let gfa = solveGfa(p, req.budget, locations, rules)
    let completionPct = 100
    // Minimum sensible dwelling: 45 m². Below that, show how far the budget goes.
    if (gfa < 45) {
      gfa = 45
      completionPct = 0
    }
    const bedrooms = Math.max(1, Math.min(6, Math.round(gfa / 45)))
    const params = { ...p, gfa, bedrooms, bathrooms: Math.max(1, Math.round(bedrooms / 2)) }
    const { result } = runEstimate(params, locations, rules)
    if (completionPct === 0) completionPct = Math.min(100, round((req.budget / result.total.mid) * 100))
    return {
      id: `opt_${i}_${hashParams(params, rules.version)}`,
      title: t(`engine.reverse.${c.key}.title`),
      description: t(`engine.reverse.${c.key}.description`),
      params,
      total: result.total,
      completionPct,
      budgetDeviationPct: Number((((result.total.mid - req.budget) / req.budget) * 100).toFixed(2)),
    }
  })
  return { budget: req.budget, options }
}

/* ---------------- Stage reach (J3) ---------------- */

export function stageReach(estimate, budget, rules = DEFAULT_RULES) {
  let funded = budget
  const stages = estimate.phases.map((p) => {
    const covered = Math.max(0, Math.min(p.amount, funded))
    funded -= covered
    const fundedPct = p.amount === 0 ? 100 : round((covered / p.amount) * 100)
    const status = fundedPct >= 100 ? 'complete' : fundedPct > 0 ? 'partial' : 'unfunded'
    return { code: p.code, name: rules.phaseNames[p.code], cost: p.amount, cumulative: p.cumulative, status, fundedPct }
  })
  const overallPct = Math.min(100, round((budget / estimate.total.mid) * 100))
  const remaining = Math.max(0, estimate.total.mid - budget)
  return {
    estimateId: estimate.id,
    budget,
    stages: stages.map((s) => ({ ...s })),
    overallPct,
    nextQuarterCost: round(Math.min(remaining, estimate.total.mid * 0.25)),
    shortfallToComplete: round(remaining),
  }
}

/* ---------------- Cost to complete (J4) ---------------- */

export function costToComplete(req, estimate, rules = DEFAULT_RULES) {
  const rangePct = rules.classes[estimate.estimateClass].rangePct
  const phases = estimate.phases.map((p) => {
    const progressPct = Math.min(100, Math.max(0, req.phaseProgress[p.code] ?? 0))
    return {
      code: p.code,
      name: p.name,
      budget: p.amount,
      progressPct,
      remaining: round(p.amount * (1 - progressPct / 100)),
    }
  })
  const valueOfWorkDone = round(phases.reduce((a, p) => a + p.budget - p.remaining, 0))
  const remainingMid = phases.reduce((a, p) => a + p.remaining, 0)
  const range = (mid) => ({
    low: round(mid * (1 - rangePct / 100)),
    mid: round(mid),
    high: round(mid * (1 + rangePct / 100)),
  })
  const remainingCost = range(remainingMid)
  const forecastTotal = {
    low: round(req.amountSpent + remainingCost.low),
    mid: round(req.amountSpent + remainingCost.mid),
    high: round(req.amountSpent + remainingCost.high),
  }
  return {
    estimateId: estimate.id,
    valueOfWorkDone,
    amountSpent: req.amountSpent,
    varianceToDate: round(req.amountSpent - valueOfWorkDone),
    remainingCost,
    forecastTotal,
    shortfall: req.params.budget ? round(forecastTotal.mid - req.params.budget) : null,
    phases,
  }
}

/* ---------------- BOQ generation (Section 8.2) ---------------- */

/**
 * Parametric BOQ items. `trade` is a key under `engine.boq.trades`; the description and quantity
 * formula live in the engine dictionary under `engine.boq.items.i<code>` (dots replaced by `_`).
 */
const ITEM_RULES = [
  {
    billCode: '01',
    code: '1.01',
    trade: 'preliminaries',
    unit: 'sum',
    qtyFixed: 1,
    wastePct: 0,
    materialId: null,
    rateFallback: 0,
  },
  {
    billCode: '02',
    code: '2.01',
    trade: 'earthworks',
    unit: 'm²',
    qtyPerM2: 1.2,
    wastePct: 0,
    materialId: 'LAB-LABOURER',
    rateFallback: 1_500,
  },
  {
    billCode: '02',
    code: '2.02',
    trade: 'earthworks',
    unit: 'm³',
    qtyPerM2: 0.25,
    wastePct: 0,
    materialId: 'PLT-EXCAVATOR',
    rateFallback: 6_500,
  },
  {
    billCode: '03',
    code: '3.01',
    trade: 'excavation',
    unit: 'm³',
    qtyPerM2: 0.42,
    wastePct: 0,
    materialId: 'LAB-LABOURER',
    rateFallback: 7_000,
  },
  {
    billCode: '03',
    code: '3.02',
    trade: 'concrete',
    unit: 'm²',
    qtyPerM2: 0.35,
    wastePct: 4,
    materialId: 'MAT-CEM-0001',
    rateFallback: 9_500,
  },
  {
    billCode: '03',
    code: '3.03',
    trade: 'concrete',
    unit: 'm³',
    qtyPerM2: 0.14,
    wastePct: 5,
    materialId: 'MAT-STL-0012',
    rateFallback: 285_000,
  },
  {
    billCode: '03',
    code: '3.04',
    trade: 'masonry',
    unit: 'm²',
    qtyPerM2: 0.55,
    wastePct: 4,
    materialId: 'MAT-BLK-0003',
    rateFallback: 28_000,
  },
  {
    billCode: '03',
    code: '3.05',
    trade: 'slab',
    unit: 'm²',
    qtyPerM2: 1.0,
    wastePct: 4,
    materialId: 'MAT-CEM-0001',
    rateFallback: 38_000,
  },
  {
    billCode: '04',
    code: '4.01',
    trade: 'frame',
    unit: 'm³',
    qtyPerM2: 0.035,
    wastePct: 5,
    materialId: 'MAT-STL-0012',
    rateFallback: 420_000,
  },
  {
    billCode: '04',
    code: '4.02',
    trade: 'frame',
    unit: 'm³',
    qtyPerM2: 0.045,
    wastePct: 5,
    materialId: 'MAT-STL-0012',
    rateFallback: 410_000,
  },
  {
    billCode: '05',
    code: '5.01',
    trade: 'masonry',
    unit: 'm²',
    qtyPerM2: 1.15,
    wastePct: 4,
    materialId: 'MAT-BLK-0003',
    rateFallback: 26_000,
  },
  {
    billCode: '05',
    code: '5.02',
    trade: 'openings',
    unit: 'm²',
    qtyPerM2: 0.16,
    wastePct: 0,
    materialId: 'MAT-GLZ-0007',
    rateFallback: 180_000,
  },
  {
    billCode: '05',
    code: '5.03',
    trade: 'openings',
    unit: 'no.',
    qtyPerM2: 0.015,
    wastePct: 0,
    materialId: 'MAT-JOI-0011',
    rateFallback: 350_000,
  },
  {
    billCode: '06',
    code: '6.01',
    trade: 'roof',
    unit: 'm²',
    qtyPerM2: 1.3,
    wastePct: 10,
    materialId: 'MAT-TIM-0009',
    rateFallback: 32_000,
  },
  {
    billCode: '06',
    code: '6.02',
    trade: 'roof',
    unit: 'm²',
    qtyPerM2: 1.3,
    wastePct: 7,
    materialId: 'MAT-ROF-0005',
    rateFallback: 7_000,
  },
  {
    billCode: '06',
    code: '6.03',
    trade: 'roof',
    unit: 'm',
    qtyPerM2: 0.35,
    wastePct: 5,
    materialId: 'MAT-PLB-0014',
    rateFallback: 12_000,
  },
  {
    billCode: '07',
    code: '7.01',
    trade: 'masonry',
    unit: 'm²',
    qtyPerM2: 0.9,
    wastePct: 4,
    materialId: 'MAT-BLK-0003',
    rateFallback: 22_000,
  },
  {
    billCode: '08',
    code: '8.01',
    trade: 'electrical',
    unit: 'no.',
    qtyPerM2: 0.25,
    wastePct: 7,
    materialId: 'MAT-ELE-0016',
    rateFallback: 45_000,
  },
  {
    billCode: '08',
    code: '8.02',
    trade: 'plumbing',
    unit: 'no.',
    qtyPerM2: 0.08,
    wastePct: 4,
    materialId: 'MAT-PLB-0014',
    rateFallback: 120_000,
  },
  {
    billCode: '09',
    code: '9.01',
    trade: 'wetTrades',
    unit: 'm²',
    qtyPerM2: 2.9,
    wastePct: 5,
    materialId: 'MAT-CEM-0001',
    rateFallback: 8_500,
  },
  {
    billCode: '09',
    code: '9.02',
    trade: 'wetTrades',
    unit: 'm²',
    qtyPerM2: 1.0,
    wastePct: 5,
    materialId: 'MAT-CEM-0001',
    rateFallback: 9_000,
  },
  {
    billCode: '10',
    code: '10.01',
    trade: 'finishes',
    unit: 'm²',
    qtyPerM2: 0.95,
    wastePct: 8,
    materialId: 'MAT-TIL-0020',
    rateFallback: 24_000,
  },
  {
    billCode: '10',
    code: '10.02',
    trade: 'finishes',
    unit: 'm²',
    qtyPerM2: 2.9,
    wastePct: 8,
    materialId: 'MAT-PNT-0018',
    rateFallback: 4_200,
  },
  {
    billCode: '10',
    code: '10.03',
    trade: 'finishes',
    unit: 'm²',
    qtyPerM2: 0.95,
    wastePct: 6,
    materialId: 'MAT-JOI-0011',
    rateFallback: 21_000,
  },
  {
    billCode: '11',
    code: '11.01',
    trade: 'joinery',
    unit: 'no.',
    qtyPerM2: 0.05,
    wastePct: 0,
    materialId: 'MAT-JOI-0011',
    rateFallback: 220_000,
  },
  {
    billCode: '11',
    code: '11.02',
    trade: 'joinery',
    unit: 'PC',
    qtyFixed: 1,
    wastePct: 0,
    materialId: null,
    rateFallback: 4_500_000,
  },
  {
    billCode: '12',
    code: '12.01',
    trade: 'sanitary',
    unit: 'no.',
    qtyPerM2: 0.04,
    wastePct: 0,
    materialId: 'MAT-PLB-0014',
    rateFallback: 380_000,
  },
  {
    billCode: '12',
    code: '12.02',
    trade: 'electrical',
    unit: 'no.',
    qtyPerM2: 0.25,
    wastePct: 3,
    materialId: 'MAT-ELE-0016',
    rateFallback: 28_000,
  },
  {
    billCode: '13',
    code: '13.01',
    trade: 'external',
    unit: 'm²',
    qtyPerM2: 0.4,
    wastePct: 5,
    materialId: 'MAT-CEM-0001',
    rateFallback: 32_000,
  },
  {
    billCode: '13',
    code: '13.02',
    trade: 'external',
    unit: 'm',
    qtyPerM2: 0.3,
    wastePct: 4,
    materialId: 'MAT-BLK-0003',
    rateFallback: 95_000,
  },
  {
    billCode: '14',
    code: '14.01',
    trade: 'handover',
    unit: 'sum',
    qtyFixed: 1,
    wastePct: 0,
    materialId: null,
    rateFallback: 0,
  },
]

/** Package phase as a PhaseCode; preliminaries are spread over the programme and have no single phase. */
function phaseOfPackage(rules, code) {
  const phase = rules.packages.find((p) => p.code === code)?.phase
  return !phase || phase === 'spread' ? null : phase
}

export const defaultAdjustments = (rules) => ({
  overheadPct: rules.defaultOverheadPct,
  contingencyPct: rules.defaultContingencyPct,
  vatPct: rules.vatPct,
})

export function generateBoq(estimate, prices, overrides, existing, rules = DEFAULT_RULES) {
  const t = i18n.getFixedT(rules.lang ?? 'en')
  const itemKey = (code) => `engine.boq.items.i${code.replace('.', '_')}`
  const BILL_NAMES = Object.fromEntries(rules.packages.map((p) => [p.code, p.name]))
  const q = estimate.params.quality
  const qMult = { ECO: 0.85, STD: 1, PRM: 1.35, LUX: 1.9 }[q]
  const location = estimate.params.locationId
  const construction = estimate.constructionCost.mid
  const footprint = estimate.params.gfa / estimate.params.storeys
  const generated = ITEM_RULES.map((r) => {
    const base =
      r.qtyFixed ??
      (r.unit === 'm' || r.billCode === '02' || r.billCode === '03' ? footprint : estimate.params.gfa) *
        (r.qtyPerM2 ?? 0)
    const price = r.materialId
      ? prices.find((p) => p.materialId === r.materialId && p.status === 'approved')
      : undefined
    const ageDays = price ? Math.round((Date.parse('2026-10-01') - Date.parse(price.sourceDate)) / 86_400_000) : 0
    const stale = ageDays > rules.stalePriceDays
    let rate = price ? price.price * (price.category === 'Labour' ? 1 : 1) : r.rateFallback
    // Composite item rates are rate-built: material snapshot price is a driver, fallback is the built-up rate.
    rate = Math.max(rate, r.rateFallback) * qMult
    if (r.code === '1.01') rate = construction * 0.05
    if (r.code === '14.01') rate = construction * 0.01
    if (r.code === '11.02') rate = r.rateFallback * qMult
    const ov = overrides[`${estimate.id}:${r.code}`] ?? null
    const qty = Number((ov?.qty ?? base).toFixed(2))
    const wastePct = ov?.wastePct ?? r.wastePct
    const finalRate = round(ov?.rate ?? rate)
    const amount = round(qty * (1 + wastePct / 100) * finalRate)
    return {
      id: `${estimate.id}:${r.code}`,
      code: r.code,
      billCode: r.billCode,
      phase: phaseOfPackage(rules, r.billCode) ?? 'P1',
      trade: t(`engine.boq.trades.${r.trade}`),
      description: t(`${itemKey(r.code)}.description`),
      unit: r.unit,
      qty,
      qtySource: ov?.qty != null ? 'manual' : 'parametric',
      formula: t(`${itemKey(r.code)}.formula`),
      wastePct,
      rate: finalRate,
      rateProvenance: price
        ? {
            priceId: price.id,
            source: price.source,
            sourceDate: price.sourceDate,
            confidence: price.confidence,
            verified: price.verified,
            stale,
          }
        : null,
      amount,
      override: ov,
      custom: false,
      figureId: `${estimate.id}:boq:${r.code}`,
    }
  })
  void location
  const customItems = (existing?.customItems ?? []).map((c, idx) => {
    const siblings = generated.filter((g) => g.billCode === c.billCode).length
    const code = `${c.billCode.replace(/^0/, '')}.${String(siblings + idx + 1).padStart(2, '0')}`
    const ov = overrides[c.id] ?? null
    const qty = Number((ov?.qty ?? c.qty).toFixed(2))
    const wastePct = ov?.wastePct ?? c.wastePct
    const finalRate = round(ov?.rate ?? c.rate)
    return {
      id: c.id,
      code,
      billCode: c.billCode,
      phase: phaseOfPackage(rules, c.billCode) ?? 'P1',
      trade: c.trade,
      description: c.description,
      unit: c.unit,
      qty,
      qtySource: 'manual',
      formula: null,
      wastePct,
      rate: finalRate,
      rateProvenance: null,
      amount: round(qty * (1 + wastePct / 100) * finalRate),
      override: ov,
      custom: true,
      figureId: `${estimate.id}:boq:custom:${c.id}`,
    }
  })
  const items = [...generated, ...customItems]
  const billCodes = [...new Set([...rules.packages.map((p) => p.code), ...items.map((i) => i.billCode)])].filter((c) =>
    items.some((i) => i.billCode === c),
  )
  const bills = billCodes.map((code) => {
    const billItems = items.filter((i) => i.billCode === code)
    return {
      code,
      name: BILL_NAMES[code] ?? code,
      phase: phaseOfPackage(rules, code),
      items: billItems,
      subtotal: round(billItems.reduce((a, i) => a + i.amount, 0)),
    }
  })
  const measuredSubtotal = round(bills.reduce((a, b) => a + b.subtotal, 0))
  const adj = existing?.adjustments ?? defaultAdjustments(rules)
  const overheadPct = adj.overheadPct
  const overhead = round(measuredSubtotal * (overheadPct / 100))
  const contingencyPct = adj.contingencyPct
  const contingency = round((measuredSubtotal + overhead) * (contingencyPct / 100))
  const vatPct = adj.vatPct
  const vat = round((measuredSubtotal + overhead + contingency) * (vatPct / 100))
  const stale = rules.blockExportOnStalePrices
    ? items
        .filter((i) => i.rateProvenance?.stale)
        .map((i) =>
          t('engine.boq.blocked.stale', {
            code: i.code,
            description: i.description,
            date: i.rateProvenance?.sourceDate,
          }),
        )
    : []
  const missing = items
    .filter((i) => !i.custom && !i.rateProvenance && i.unit !== 'sum' && i.unit !== 'PC')
    .map((i) => t('engine.boq.blocked.missing', { code: i.code, description: i.description }))
  return {
    id: `boq_${estimate.id}`,
    projectId: estimate.projectId ?? '',
    estimateId: estimate.id,
    version: existing?.version ?? 1,
    status: existing?.status ?? 'draft',
    classLabel: rules.classes[4].label,
    currency: 'RWF',
    bills,
    measuredSubtotal,
    overheadPct,
    overhead,
    contingencyPct,
    contingency,
    vatPct,
    vat,
    grandTotal: measuredSubtotal + overhead + contingency + vat,
    exportBlockedReasons: [...stale, ...missing],
    updatedAt: '2026-10-01T00:00:00.000Z',
    updatedBy: 'engine',
  }
}
