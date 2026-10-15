/**
 * Views over the same estimate model (Section 1.2): reverse budget,
 * stage reach, cost-to-complete and BOQ generation.
 */
import type {
  Boq,
  BoqBill,
  BoqItem,
  BoqOverride,
  CostToCompleteRequest,
  CostToCompleteResult,
  EstimateParams,
  EstimateResult,
  Location,
  PriceRecord,
  QualityLevel,
  ReverseBudgetRequest,
  ReverseBudgetResult,
  StageReachResult,
} from '@/shared/api/schemas'
import { CLASS_RANGE_PCT, PACKAGES, PHASE_NAMES, VAT_PCT } from './rules'
import { hashParams, runCore, runEstimate } from './estimate'

const round = (n: number) => Math.round(n)

/* ---------------- Reverse budget (J2) ---------------- */

/** Bisection on GFA so the forward engine lands within ±1 % of the budget. */
function solveGfa(base: EstimateParams, budget: number, locations: Location[]): number {
  let lo = 20
  let hi = 5000
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const t = runCore({ ...base, gfa: mid }, locations).totalMid
    if (t > budget) hi = mid
    else lo = mid
  }
  return Math.floor(lo)
}

export function reverseBudget(req: ReverseBudgetRequest, locations: Location[]): ReverseBudgetResult {
  const baseParams: EstimateParams = {
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
  const candidates: Array<{ title: string; description: string; quality: QualityLevel; storeys: number; features: EstimateParams['features'] }> = [
    { title: 'Compact & economical', description: 'Single storey, economy finishes, maximum floor area for the money.', quality: 'ECO', storeys: 1, features: [] },
    { title: 'Standard family home', description: 'Single storey, standard finishes, boundary wall included.', quality: 'STD', storeys: 1, features: ['boundaryWall'] },
    { title: 'Two-storey standard', description: 'Two storeys on a smaller footprint, standard finishes.', quality: 'STD', storeys: 2, features: [] },
    { title: 'Smaller but premium', description: 'Premium finishes and solar on a reduced area.', quality: 'PRM', storeys: 1, features: ['solar'] },
  ]
  const options = candidates.map((c, i) => {
    const p: EstimateParams = { ...baseParams, quality: c.quality, storeys: c.storeys, features: c.features }
    let gfa = solveGfa(p, req.budget, locations)
    let completionPct = 100
    // Minimum sensible dwelling: 45 m². Below that, show how far the budget goes.
    if (gfa < 45) {
      gfa = 45
      completionPct = 0
    }
    const bedrooms = Math.max(1, Math.min(6, Math.round(gfa / 45)))
    const params: EstimateParams = { ...p, gfa, bedrooms, bathrooms: Math.max(1, Math.round(bedrooms / 2)) }
    const { result } = runEstimate(params, locations)
    if (completionPct === 0) completionPct = Math.min(100, round((req.budget / result.total.mid) * 100))
    return {
      id: `opt_${i}_${hashParams(params)}`,
      title: c.title,
      description: c.description,
      params,
      total: result.total,
      completionPct,
      budgetDeviationPct: Number((((result.total.mid - req.budget) / req.budget) * 100).toFixed(2)),
    }
  })
  return { budget: req.budget, options }
}

/* ---------------- Stage reach (J3) ---------------- */

export function stageReach(estimate: EstimateResult, budget: number): StageReachResult {
  let funded = budget
  const stages = estimate.phases.map((p) => {
    const covered = Math.max(0, Math.min(p.amount, funded))
    funded -= covered
    const fundedPct = p.amount === 0 ? 100 : round((covered / p.amount) * 100)
    const status = fundedPct >= 100 ? 'complete' : fundedPct > 0 ? 'partial' : 'unfunded'
    return { code: p.code, name: PHASE_NAMES[p.code], cost: p.amount, cumulative: p.cumulative, status, fundedPct } as const
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

export function costToComplete(req: CostToCompleteRequest, estimate: EstimateResult): CostToCompleteResult {
  const rangePct = CLASS_RANGE_PCT[estimate.estimateClass]
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
  const range = (mid: number) => ({
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

interface ItemRule {
  billCode: string
  code: string
  trade: string
  description: string
  unit: BoqItem['unit']
  /** Quantity per m² GFA (or per unit of perimeter for walls). */
  qtyPerM2?: number
  qtyFixed?: number
  formula: string
  wastePct: number
  /** Material id in the price DB used for the rate; null = labour/sum. */
  materialId: string | null
  rateFallback: number
}

const ITEM_RULES: ItemRule[] = [
  { billCode: '01', code: '1.01', trade: 'Preliminaries', description: 'Site establishment, offices, stores, temporary utilities', unit: 'sum', qtyFixed: 1, formula: '5 % of construction', wastePct: 0, materialId: null, rateFallback: 0 },
  { billCode: '02', code: '2.01', trade: 'Earthworks', description: 'Strip topsoil 150 mm, stockpile', unit: 'm²', qtyPerM2: 1.2, formula: 'footprint × 1.2', wastePct: 0, materialId: 'LAB-LABOURER', rateFallback: 1_500 },
  { billCode: '02', code: '2.02', trade: 'Earthworks', description: 'Bulk cut/fill to level platform', unit: 'm³', qtyPerM2: 0.25, formula: 'footprint × 0.25', wastePct: 0, materialId: 'PLT-EXCAVATOR', rateFallback: 6_500 },
  { billCode: '03', code: '3.01', trade: 'Excavation', description: 'Excavate strip footing trenches to 1.2 m', unit: 'm³', qtyPerM2: 0.42, formula: 'footing length × 0.6 × 1.2', wastePct: 0, materialId: 'LAB-LABOURER', rateFallback: 7_000 },
  { billCode: '03', code: '3.02', trade: 'Concrete', description: 'Blinding C15, 50 mm', unit: 'm²', qtyPerM2: 0.35, formula: 'footing area', wastePct: 4, materialId: 'MAT-CEM-0001', rateFallback: 9_500 },
  { billCode: '03', code: '3.03', trade: 'Concrete', description: 'RC strip footings C25 incl. formwork and reinforcement', unit: 'm³', qtyPerM2: 0.14, formula: 'footing L × W × D', wastePct: 5, materialId: 'MAT-STL-0012', rateFallback: 285_000 },
  { billCode: '03', code: '3.04', trade: 'Masonry', description: 'Foundation walls, 200 mm hollow blocks to DPC', unit: 'm²', qtyPerM2: 0.55, formula: 'perimeter × 0.9 m', wastePct: 4, materialId: 'MAT-BLK-0003', rateFallback: 28_000 },
  { billCode: '03', code: '3.05', trade: 'Slab', description: 'Hardcore 150 mm, DPM and 125 mm ground slab', unit: 'm²', qtyPerM2: 1.0, formula: 'footprint', wastePct: 4, materialId: 'MAT-CEM-0001', rateFallback: 38_000 },
  { billCode: '04', code: '4.01', trade: 'Frame', description: 'RC columns C25 incl. formwork and reinforcement', unit: 'm³', qtyPerM2: 0.035, formula: 'count × size × height', wastePct: 5, materialId: 'MAT-STL-0012', rateFallback: 420_000 },
  { billCode: '04', code: '4.02', trade: 'Frame', description: 'RC ring beams and lintels', unit: 'm³', qtyPerM2: 0.045, formula: 'span grid', wastePct: 5, materialId: 'MAT-STL-0012', rateFallback: 410_000 },
  { billCode: '05', code: '5.01', trade: 'Masonry', description: 'External walls, 200 mm hollow blocks', unit: 'm²', qtyPerM2: 1.15, formula: 'perimeter × height − openings', wastePct: 4, materialId: 'MAT-BLK-0003', rateFallback: 26_000 },
  { billCode: '05', code: '5.02', trade: 'Openings', description: 'Aluminium windows, single glazed, supply and fix', unit: 'm²', qtyPerM2: 0.16, formula: 'window schedule', wastePct: 0, materialId: 'MAT-GLZ-0007', rateFallback: 180_000 },
  { billCode: '05', code: '5.03', trade: 'Openings', description: 'External doors, solid core, supply and fix', unit: 'no.', qtyPerM2: 0.015, formula: 'door schedule', wastePct: 0, materialId: 'MAT-JOI-0011', rateFallback: 350_000 },
  { billCode: '06', code: '6.01', trade: 'Roof', description: 'Timber roof trusses and purlins', unit: 'm²', qtyPerM2: 1.3, formula: 'slope-adjusted roof area', wastePct: 10, materialId: 'MAT-TIM-0009', rateFallback: 32_000 },
  { billCode: '06', code: '6.02', trade: 'Roof', description: 'Pre-painted IT4 gauge 28 sheeting', unit: 'm²', qtyPerM2: 1.3, formula: 'slope-adjusted roof area', wastePct: 7, materialId: 'MAT-ROF-0005', rateFallback: 7_000 },
  { billCode: '06', code: '6.03', trade: 'Roof', description: 'Gutters and downpipes, PVC', unit: 'm', qtyPerM2: 0.35, formula: 'eaves length', wastePct: 5, materialId: 'MAT-PLB-0014', rateFallback: 12_000 },
  { billCode: '07', code: '7.01', trade: 'Masonry', description: 'Internal partitions, 150 mm hollow blocks', unit: 'm²', qtyPerM2: 0.9, formula: 'net wall area', wastePct: 4, materialId: 'MAT-BLK-0003', rateFallback: 22_000 },
  { billCode: '08', code: '8.01', trade: 'Electrical', description: 'Conduits, boxes and wiring rough-in', unit: 'no.', qtyPerM2: 0.25, formula: 'points per room', wastePct: 7, materialId: 'MAT-ELE-0016', rateFallback: 45_000 },
  { billCode: '08', code: '8.02', trade: 'Plumbing', description: 'Water supply and drainage rough-in', unit: 'no.', qtyPerM2: 0.08, formula: 'fixture points', wastePct: 4, materialId: 'MAT-PLB-0014', rateFallback: 120_000 },
  { billCode: '09', code: '9.01', trade: 'Wet trades', description: 'Internal plaster 15 mm, two coats', unit: 'm²', qtyPerM2: 2.9, formula: 'wall areas both sides', wastePct: 5, materialId: 'MAT-CEM-0001', rateFallback: 8_500 },
  { billCode: '09', code: '9.02', trade: 'Wet trades', description: 'Floor screed 40 mm', unit: 'm²', qtyPerM2: 1.0, formula: 'floor area', wastePct: 5, materialId: 'MAT-CEM-0001', rateFallback: 9_000 },
  { billCode: '10', code: '10.01', trade: 'Finishes', description: 'Floor tiles, supply and lay', unit: 'm²', qtyPerM2: 0.95, formula: 'floor area by room', wastePct: 8, materialId: 'MAT-TIL-0020', rateFallback: 24_000 },
  { billCode: '10', code: '10.02', trade: 'Finishes', description: 'Emulsion paint, 1 undercoat + 2 coats', unit: 'm²', qtyPerM2: 2.9, formula: 'plaster area', wastePct: 8, materialId: 'MAT-PNT-0018', rateFallback: 4_200 },
  { billCode: '10', code: '10.03', trade: 'Finishes', description: 'Gypsum ceiling incl. framing', unit: 'm²', qtyPerM2: 0.95, formula: 'ceiling area', wastePct: 6, materialId: 'MAT-JOI-0011', rateFallback: 21_000 },
  { billCode: '11', code: '11.01', trade: 'Joinery', description: 'Internal flush doors incl. ironmongery', unit: 'no.', qtyPerM2: 0.05, formula: 'rooms', wastePct: 0, materialId: 'MAT-JOI-0011', rateFallback: 220_000 },
  { billCode: '11', code: '11.02', trade: 'Joinery', description: 'Fitted kitchen units (PC sum)', unit: 'PC', qtyFixed: 1, formula: 'allowance', wastePct: 0, materialId: null, rateFallback: 4_500_000 },
  { billCode: '12', code: '12.01', trade: 'Sanitary', description: 'Sanitary fixtures, mid-range, supply and fix', unit: 'no.', qtyPerM2: 0.04, formula: 'bathroom schedule', wastePct: 0, materialId: 'MAT-PLB-0014', rateFallback: 380_000 },
  { billCode: '12', code: '12.02', trade: 'Electrical', description: 'Light fittings, switches and sockets', unit: 'no.', qtyPerM2: 0.25, formula: 'points', wastePct: 3, materialId: 'MAT-ELE-0016', rateFallback: 28_000 },
  { billCode: '13', code: '13.01', trade: 'External', description: 'Paving and surface drainage', unit: 'm²', qtyPerM2: 0.4, formula: 'external paved area', wastePct: 5, materialId: 'MAT-CEM-0001', rateFallback: 32_000 },
  { billCode: '13', code: '13.02', trade: 'External', description: 'Boundary wall 2.1 m incl. foundation', unit: 'm', qtyPerM2: 0.3, formula: 'plot perimeter', wastePct: 4, materialId: 'MAT-BLK-0003', rateFallback: 95_000 },
  { billCode: '14', code: '14.01', trade: 'Handover', description: 'Testing, commissioning, snagging, as-built docs', unit: 'sum', qtyFixed: 1, formula: '1 % of construction', wastePct: 0, materialId: null, rateFallback: 0 },
]

/** Package phase as a PhaseCode; preliminaries are spread over the programme and have no single phase. */
function phaseOfPackage(code: string): BoqBill['phase'] {
  const phase = PACKAGES.find((p) => p.code === code)?.phase
  return !phase || phase === 'spread' ? null : phase
}

const BILL_NAMES: Record<string, string> = Object.fromEntries(
  PACKAGES.map((p) => [p.code, p.name]),
)

export function generateBoq(
  estimate: EstimateResult,
  prices: PriceRecord[],
  overrides: Record<string, BoqOverride>,
  existing?: Pick<Boq, 'version' | 'status'>,
): Boq {
  const q = estimate.params.quality
  const qMult = { ECO: 0.85, STD: 1, PRM: 1.35, LUX: 1.9 }[q]
  const location = estimate.params.locationId
  const construction = estimate.constructionCost.mid
  const footprint = estimate.params.gfa / estimate.params.storeys
  const items: BoqItem[] = ITEM_RULES.map((r) => {
    const base =
      r.qtyFixed ?? (r.unit === 'm' || r.billCode === '02' || r.billCode === '03' ? footprint : estimate.params.gfa) * (r.qtyPerM2 ?? 0)
    const price = r.materialId ? prices.find((p) => p.materialId === r.materialId && p.status === 'approved') : undefined
    const ageDays = price ? Math.round((Date.parse('2026-10-01') - Date.parse(price.sourceDate)) / 86_400_000) : 0
    const stale = ageDays > 90
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
      phase: phaseOfPackage(r.billCode) ?? 'P1',
      trade: r.trade,
      description: r.description,
      unit: r.unit,
      qty,
      qtySource: ov?.qty != null ? 'manual' : 'parametric',
      formula: r.formula,
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
      figureId: `${estimate.id}:boq:${r.code}`,
    }
  })
  void location
  const billCodes = [...new Set(items.map((i) => i.billCode))]
  const bills: BoqBill[] = billCodes.map((code) => {
    const billItems = items.filter((i) => i.billCode === code)
    return {
      code,
      name: BILL_NAMES[code] ?? code,
      phase: phaseOfPackage(code),
      items: billItems,
      subtotal: round(billItems.reduce((a, i) => a + i.amount, 0)),
    }
  })
  const measuredSubtotal = round(bills.reduce((a, b) => a + b.subtotal, 0))
  const contingencyPct = estimate.estimateClass >= 4 ? 5 : 8
  const contingency = round(measuredSubtotal * (contingencyPct / 100))
  const vat = round((measuredSubtotal + contingency) * (VAT_PCT / 100))
  const stale = items.filter((i) => i.rateProvenance?.stale).map((i) => `${i.code} ${i.description}: price dated ${i.rateProvenance?.sourceDate}`)
  const missing = items.filter((i) => !i.rateProvenance && i.unit !== 'sum' && i.unit !== 'PC').map((i) => `${i.code} ${i.description}: no price record`)
  return {
    id: `boq_${estimate.id}`,
    projectId: estimate.projectId ?? '',
    estimateId: estimate.id,
    version: existing?.version ?? 1,
    status: existing?.status ?? 'draft',
    classLabel: 'Professional BOQ (unverified until signed)',
    currency: 'RWF',
    bills,
    measuredSubtotal,
    contingencyPct,
    contingency,
    vatPct: VAT_PCT,
    vat,
    grandTotal: measuredSubtotal + contingency + vat,
    exportBlockedReasons: [...stale, ...missing],
    updatedAt: '2026-10-01T00:00:00.000Z',
    updatedBy: 'engine',
  }
}
