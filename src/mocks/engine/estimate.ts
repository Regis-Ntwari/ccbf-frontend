/**
 * Deterministic mock estimate engine.
 * estimate(params, locations) → EstimateResult (+ trace tree by figureId).
 *
 * No I/O, no randomness: the same params always produce the same result and
 * the same ids, which lets the UI treat estimate runs as idempotent.
 */
import type {
  ElementGroup,
  EstimateClass,
  EstimateParams,
  EstimateResult,
  EstimateWarning,
  Location,
  PhaseCode,
  QualityLevel,
  TraceNode,
} from '@/shared/api/schemas'
import { ESTIMATE_CLASS_LABEL, PHASE_CODES, QUALITY_LEVELS } from '@/shared/api/schemas'
import {
  BASE_RATE_PER_M2,
  CLASS_CONTINGENCY_PCT,
  CLASS_RANGE_PCT,
  ELEMENT_NAMES,
  ENGINE_VERSION,
  FEATURE_RULES,
  FEES_PCT,
  PACKAGES,
  PHASE_NAMES,
  PRICE_SNAPSHOT_ID,
  QUALITY_MULTIPLIER,
  RULES_VERSION,
  SPECIAL_QUALITY_MULTIPLIER,
} from './rules'

export interface EngineOutput {
  result: EstimateResult
  trace: Map<string, TraceNode>
}

const round = (n: number) => Math.round(n)

/** Stable hash so identical params → identical estimate id (idempotent runs). */
export function hashParams(params: EstimateParams): string {
  const s = JSON.stringify(params, Object.keys(params).sort())
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export function qualityFor(params: EstimateParams, group: ElementGroup): QualityLevel {
  return params.elementOverrides[group] ?? params.quality
}

function multiplierFor(group: ElementGroup, q: QualityLevel): number {
  return SPECIAL_QUALITY_MULTIPLIER[group]?.[q] ?? QUALITY_MULTIPLIER[q]
}

const NOW = '2026-10-01T00:00:00.000Z'

export function runEstimate(params: EstimateParams, locations: Location[]): EngineOutput {
  const trace = new Map<string, TraceNode>()
  const id = `est_${hashParams(params)}`
  const location = locations.find((l) => l.id === params.locationId) ?? locations[0]!
  const locationFactor = location.factor

  // Class: the mock cannot read drawings, so Level 3+ is downgraded to 2.
  const warnings: EstimateWarning[] = []
  let estimateClass: EstimateClass = params.requestedClass
  if (estimateClass > 2) {
    estimateClass = 2
    warnings.push({
      code: 'downgraded_class',
      message: 'Design-stage estimates need plans or measured quantities. Shown as a preliminary estimate.',
      blocksProfessionalExport: false,
    })
  }
  if (params.site.sloping === 'unknown') {
    warnings.push({
      code: 'site_unknown',
      message: 'Site slope unknown: earthworks and foundations assume a flat site (+/- 3 % of total).',
      blocksProfessionalExport: false,
    })
  }

  const baseRate = BASE_RATE_PER_M2[params.typology]
  const storeyFactor = 1 + 0.04 * Math.min(params.storeys - 1, 10)
  const slopeFactor = params.site.sloping === 'steep' ? 1.06 : params.site.sloping === 'gentle' ? 1.02 : 1
  const roomsArea =
    (params.rooms.garage ? 18 : 0) + (params.rooms.office ? 10 : 0) + (params.rooms.store ? 6 : 0)
  const effectiveGfa = params.gfa + roomsArea

  const base = effectiveGfa * baseRate * locationFactor * storeyFactor * slopeFactor

  const traceBase: TraceNode = {
    id: `${id}:base`,
    label: 'Base construction cost (STD quality)',
    value: round(base),
    unit: 'RWF',
    formula: 'GFA × base rate × location factor × storey factor × slope factor',
    inputs: [
      { name: 'GFA (incl. garage/office/store)', value: effectiveGfa, unit: 'm²' },
      { name: `Base rate (${params.typology}, STD, Kigali)`, value: baseRate, unit: 'RWF/m²' },
      { name: `Location factor (${location.name})`, value: locationFactor },
      { name: 'Storey factor', value: Number(storeyFactor.toFixed(3)) },
      { name: 'Slope factor', value: slopeFactor },
    ],
    assumptions: ['Base rates are illustrative mock values (Section 6 sample data).'],
    lastUpdated: NOW,
    changedBy: 'engine',
    children: [],
  }
  trace.set(traceBase.id, traceBase)

  // Package amounts
  const packageAmounts = new Map<string, number>()
  const elementAmounts = new Map<ElementGroup, number>()
  const elementNodes: TraceNode[] = []
  for (const pkg of PACKAGES) {
    const q = pkg.element ? qualityFor(params, pkg.element) : 'STD'
    const mult = pkg.element ? multiplierFor(pkg.element, q) : 1
    let amount = base * pkg.share * mult
    // Feature boosts on specific elements
    for (const f of params.features) {
      const boost = FEATURE_RULES[f].elementBoost
      if (boost && pkg.element === boost.group) amount *= 1 + boost.pct / 100
    }
    packageAmounts.set(pkg.code, amount)
    if (pkg.element) {
      elementAmounts.set(pkg.element, (elementAmounts.get(pkg.element) ?? 0) + amount)
      const node: TraceNode = {
        id: `${id}:pkg:${pkg.code}`,
        label: `${pkg.code} ${pkg.name}`,
        value: round(amount),
        unit: 'RWF',
        formula: 'base × package share × quality multiplier',
        inputs: [
          { name: 'Base', value: round(base), unit: 'RWF' },
          { name: 'Package share', value: pkg.share },
          { name: `Quality multiplier (${q})`, value: mult },
        ],
        assumptions: [`Quality ${q} for ${ELEMENT_NAMES[pkg.element]}`],
        price: {
          priceId: `${PRICE_SNAPSHOT_ID}:${pkg.code}`,
          source: 'Mock price snapshot',
          sourceDate: '2026-10-01',
          confidence: 'medium',
          verified: false,
        },
        lastUpdated: NOW,
        changedBy: 'engine',
        children: [],
      }
      trace.set(node.id, node)
      elementNodes.push(node)
    }
  }

  // Feature add-ons (fixed / per bedroom / % of base) land in external works or services
  const featureNodes: TraceNode[] = []
  for (const f of params.features) {
    const rule = FEATURE_RULES[f]
    let amt = 0
    if (rule.fixed) amt = rule.fixed * locationFactor
    if (rule.perBedroom) amt = rule.perBedroom * Math.max(2, params.bedrooms) * locationFactor
    if (rule.pctOfBase) amt = base * rule.pctOfBase
    if (amt > 0) {
      const target: ElementGroup = f === 'ac' ? 'hvac' : f === 'solar' || f === 'generator' || f === 'smartHome' ? 'electrical' : 'external'
      elementAmounts.set(target, (elementAmounts.get(target) ?? 0) + amt)
      const code = target === 'external' ? '13' : target === 'hvac' ? '08H' : '12E'
      packageAmounts.set(code, (packageAmounts.get(code) ?? 0) + amt)
      const node: TraceNode = {
        id: `${id}:feature:${f}`,
        label: rule.name,
        value: round(amt),
        unit: 'RWF',
        formula: rule.fixed ? 'fixed allowance × location factor' : rule.perBedroom ? 'per-bedroom allowance × max(2, bedrooms)' : 'base × %',
        inputs: [{ name: 'Location factor', value: locationFactor }],
        assumptions: ['Allowance (provisional sum) pending specification.'],
        lastUpdated: NOW,
        changedBy: 'engine',
        children: [],
      }
      trace.set(node.id, node)
      featureNodes.push(node)
    }
  }

  const construction = [...packageAmounts.values()].reduce((a, b) => a + b, 0)
  const contingencyPct = CLASS_CONTINGENCY_PCT[estimateClass]
  const contingency = construction * (contingencyPct / 100)
  const fees = construction * (FEES_PCT / 100)
  const totalMid = construction + contingency + fees
  const rangePct = CLASS_RANGE_PCT[estimateClass]
  const range = (mid: number) => ({
    low: round(mid * (1 - rangePct / 100)),
    mid: round(mid),
    high: round(mid * (1 + rangePct / 100)),
  })

  // Phases: prelims spread pro-rata over P1..P9.
  const phaseRaw = new Map<PhaseCode, number>()
  for (const code of PHASE_CODES) phaseRaw.set(code, 0)
  let spread = 0
  for (const pkg of PACKAGES) {
    const amt = packageAmounts.get(pkg.code) ?? 0
    if (pkg.phase === 'spread') spread += amt
    else phaseRaw.set(pkg.phase, (phaseRaw.get(pkg.phase) ?? 0) + amt)
  }
  const nonSpread = construction - spread
  const durationMonths = Math.min(36, Math.ceil(6 + effectiveGfa / 60 + params.storeys * 1.5))
  let cumulative = 0
  let monthCursor = 0
  const phases = PHASE_CODES.map((code) => {
    const raw = phaseRaw.get(code) ?? 0
    const withPrelims = raw + (nonSpread > 0 ? (raw / nonSpread) * spread : 0)
    // Contingency and fees follow the phases proportionally so the phase table sums to the total.
    const amount = withPrelims * (totalMid / construction)
    cumulative += amount
    const months = Math.max(1, Math.round((amount / totalMid) * durationMonths))
    const monthStart = monthCursor
    const monthEnd = Math.min(durationMonths, monthCursor + months)
    monthCursor = monthEnd
    const figureId = `${id}:phase:${code}`
    trace.set(figureId, {
      id: figureId,
      label: `${PHASE_NAMES[code]} (${code})`,
      value: round(amount),
      unit: 'RWF',
      formula: 'Σ packages in phase + pro-rata preliminaries, contingency and fees',
      inputs: [
        { name: 'Packages in phase', value: round(raw), unit: 'RWF' },
        { name: 'Preliminaries share', value: round(withPrelims - raw), unit: 'RWF' },
      ],
      assumptions: ['Preliminaries spread pro-rata over construction phases.'],
      lastUpdated: NOW,
      changedBy: 'engine',
      children: PACKAGES.filter((p) => p.phase === code && p.element)
        .map((p) => trace.get(`${id}:pkg:${p.code}`))
        .filter((n): n is TraceNode => Boolean(n)),
    })
    return {
      code,
      name: PHASE_NAMES[code],
      amount: round(amount),
      pct: Number(((amount / totalMid) * 100).toFixed(1)),
      cumulative: round(cumulative),
      monthStart,
      monthEnd,
      figureId,
    }
  })

  // Cash flow: spread each phase evenly over its months.
  const monthly = new Array<number>(durationMonths + 1).fill(0)
  for (const p of phases) {
    const span = Math.max(1, p.monthEnd - p.monthStart)
    for (let m = p.monthStart; m < p.monthStart + span && m <= durationMonths; m++) {
      monthly[m] = (monthly[m] ?? 0) + p.amount / span
    }
  }
  let cum = 0
  const cashFlow = monthly.map((amount, month) => {
    cum += amount
    return { month, amount: round(amount), cumulative: round(cum) }
  })

  // Quality options: rerun the core at each level (same params otherwise).
  const qualityOptions = QUALITY_LEVELS.map((q) => {
    if (q === params.quality && Object.keys(params.elementOverrides).length === 0) {
      return { quality: q, total: range(totalMid), costPerM2: round(totalMid / params.gfa), figureId: `${id}:total` }
    }
    const alt = runCore({ ...params, quality: q, elementOverrides: {} }, locations)
    return {
      quality: q,
      total: range(alt.totalMid),
      costPerM2: round(alt.totalMid / params.gfa),
      figureId: `${alt.id}:total`,
    }
  })

  const elements = [...elementAmounts.entries()].map(([group, amount]) => ({
    group,
    name: ELEMENT_NAMES[group],
    quality: qualityFor(params, group),
    amount: round(amount),
    packageCode: PACKAGES.find((p) => p.element === group)?.code ?? '13',
    figureId: `${id}:pkg:${PACKAGES.find((p) => p.element === group)?.code ?? '13'}`,
  }))

  const totalFigureId = `${id}:total`
  trace.set(totalFigureId, {
    id: totalFigureId,
    label: 'Total project cost (most likely)',
    value: round(totalMid),
    unit: 'RWF',
    formula: 'construction + contingency + fees & taxes',
    inputs: [
      { name: 'Construction cost', value: round(construction), unit: 'RWF' },
      { name: `Contingency (${contingencyPct} %)`, value: round(contingency), unit: 'RWF' },
      { name: `Professional fees, permits & taxes (${FEES_PCT} %)`, value: round(fees), unit: 'RWF' },
    ],
    assumptions: [
      `Range ±${rangePct} % reflects estimate class ${estimateClass} (${ESTIMATE_CLASS_LABEL[estimateClass]}).`,
      'Excludes land, loan interest and VAT on fees.',
    ],
    lastUpdated: NOW,
    changedBy: 'engine',
    children: [traceBase, ...elementNodes, ...featureNodes],
  })

  // A deliberately stale price so the UI can demonstrate the warning path.
  if (qualityFor(params, 'floors') === 'PRM') {
    warnings.push({
      code: 'stale_price',
      message: 'Porcelain tile 60×60 price is older than 90 days (MAT-TIL-0021). Professional BOQ export is blocked until re-priced.',
      blocksProfessionalExport: true,
    })
  }

  const result: EstimateResult = {
    id,
    projectId: null,
    createdAt: NOW,
    estimateClass,
    classLabel: ESTIMATE_CLASS_LABEL[estimateClass],
    engineVersion: ENGINE_VERSION,
    rulesVersion: RULES_VERSION,
    priceSnapshotId: PRICE_SNAPSHOT_ID,
    currency: 'RWF',
    params,
    total: range(totalMid),
    constructionCost: range(construction),
    feesAndTaxes: round(fees),
    contingency: round(contingency),
    costPerM2: round(totalMid / params.gfa),
    durationMonths,
    phases,
    elements,
    qualityOptions,
    cashFlow,
    assumptions: [
      { key: 'rates', text: `Rates from price snapshot ${PRICE_SNAPSHOT_ID} (mock, unverified).`, source: 'Catalogue' },
      { key: 'location', text: `${location.name} price factor ${locationFactor.toFixed(2)} vs Kigali.`, source: 'Location table' },
      { key: 'storeys', text: `${params.storeys} storey(s); frame cost +4 % per additional storey.` },
      { key: 'prelims', text: 'Preliminaries 5 % of construction, spread over the programme.' },
      { key: 'contingency', text: `Contingency ${contingencyPct} % for class ${estimateClass}.` },
      { key: 'fees', text: `Professional fees, permits and taxes ${FEES_PCT} %, shown separately from construction.` },
      { key: 'exclusions', text: 'Excludes land purchase, finance costs, furniture and loose equipment.' },
    ],
    warnings,
    totalFigureId,
  }
  return { result, trace }
}

/** Lightweight core used for quality-option comparisons (no trace). */
function runCore(params: EstimateParams, locations: Location[]): { id: string; totalMid: number } {
  const location = locations.find((l) => l.id === params.locationId) ?? locations[0]!
  const storeyFactor = 1 + 0.04 * Math.min(params.storeys - 1, 10)
  const slopeFactor = params.site.sloping === 'steep' ? 1.06 : params.site.sloping === 'gentle' ? 1.02 : 1
  const roomsArea = (params.rooms.garage ? 18 : 0) + (params.rooms.office ? 10 : 0) + (params.rooms.store ? 6 : 0)
  const base = (params.gfa + roomsArea) * BASE_RATE_PER_M2[params.typology] * location.factor * storeyFactor * slopeFactor
  let construction = 0
  for (const pkg of PACKAGES) {
    const q = pkg.element ? qualityFor(params, pkg.element) : 'STD'
    let amount = base * pkg.share * (pkg.element ? multiplierFor(pkg.element, q) : 1)
    for (const f of params.features) {
      const boost = FEATURE_RULES[f].elementBoost
      if (boost && pkg.element === boost.group) amount *= 1 + boost.pct / 100
    }
    construction += amount
  }
  for (const f of params.features) {
    const rule = FEATURE_RULES[f]
    if (rule.fixed) construction += rule.fixed * location.factor
    if (rule.perBedroom) construction += rule.perBedroom * Math.max(2, params.bedrooms) * location.factor
    if (rule.pctOfBase) construction += base * rule.pctOfBase
  }
  const cls: EstimateClass = params.requestedClass > 2 ? 2 : params.requestedClass
  const totalMid = construction * (1 + CLASS_CONTINGENCY_PCT[cls] / 100 + FEES_PCT / 100)
  return { id: `est_${hashParams(params)}`, totalMid }
}

export { runCore }
