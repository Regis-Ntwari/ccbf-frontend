import { PHASE_CODES, QUALITY_LEVELS } from '@/shared/api/schemas'
import i18n from '@/shared/i18n'
import { DEFAULT_RULES, ENGINE_VERSION, PRICE_SNAPSHOT_ID } from './rules'

const round = (n) => Math.round(n)

/** Stable hash so identical params + rules version → identical estimate id. */
export function hashParams(params, rulesVersion = DEFAULT_RULES.version) {
  const s = JSON.stringify(params, Object.keys(params).sort()) + `|r${rulesVersion}`
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export function qualityFor(params, group) {
  return params.elementOverrides[group] ?? params.quality
}

const NOW = '2026-10-01T00:00:00.000Z'

function multiplierFor(rules, group, q) {
  return rules.elementMultipliers[group]?.[q] ?? rules.qualityMultiplier[q]
}

/** Core arithmetic shared by the full run and the quality-option comparisons. */
function runCore(params, locations, rules) {
  const location = locations.find((l) => l.id === params.locationId) ?? locations[0]
  const locationFactor = location.factor
  const estimateClass = params.requestedClass > 2 ? 2 : params.requestedClass
  const storeyFactor = 1 + (rules.storeyFactorPct / 100) * Math.min(params.storeys - 1, 10)
  const slopeFactor =
    params.site.sloping === 'steep'
      ? rules.slopeFactors.steep
      : params.site.sloping === 'gentle'
        ? rules.slopeFactors.gentle
        : 1
  const roomsArea = (params.rooms.garage ? 18 : 0) + (params.rooms.office ? 10 : 0) + (params.rooms.store ? 6 : 0)
  const effectiveGfa = params.gfa + roomsArea
  const base = effectiveGfa * rules.baseRate[params.typology] * locationFactor * storeyFactor * slopeFactor

  const packageAmounts = new Map()
  const elementAmounts = new Map()
  for (const pkg of rules.packages) {
    const q = pkg.element ? qualityFor(params, pkg.element) : 'STD'
    let amount = base * pkg.share * (pkg.element ? multiplierFor(rules, pkg.element, q) : 1)
    for (const f of params.features) {
      const rule = rules.features[f]
      if (rule?.enabled && rule.boostGroup && rule.boostPct != null && pkg.element === rule.boostGroup)
        amount *= 1 + rule.boostPct / 100
    }
    packageAmounts.set(pkg.code, amount)
    if (pkg.element) elementAmounts.set(pkg.element, (elementAmounts.get(pkg.element) ?? 0) + amount)
  }
  const featureAmounts = []
  for (const f of params.features) {
    const rule = rules.features[f]
    if (!rule?.enabled) continue
    let amt = 0
    let kind = ''
    if (rule.fixed) {
      amt = rule.fixed * locationFactor
      kind = 'fixed'
    }
    if (rule.perBedroom) {
      amt = rule.perBedroom * Math.max(2, params.bedrooms) * locationFactor
      kind = 'perBedroom'
    }
    if (rule.pctOfBase) {
      amt = base * rule.pctOfBase
      kind = 'pctOfBase'
    }
    if (amt > 0) {
      const target =
        f === 'ac' ? 'hvac' : f === 'solar' || f === 'generator' || f === 'smartHome' ? 'electrical' : 'external'
      elementAmounts.set(target, (elementAmounts.get(target) ?? 0) + amt)
      const code = target === 'external' ? '13' : target === 'hvac' ? '08H' : '12E'
      packageAmounts.set(code, (packageAmounts.get(code) ?? 0) + amt)
      featureAmounts.push({ id: f, label: rule.label, amount: amt, kind })
    }
  }
  const construction = [...packageAmounts.values()].reduce((a, b) => a + b, 0)
  const contingencyPct = rules.classes[estimateClass].contingencyPct
  const contingency = construction * (contingencyPct / 100)
  const fees = construction * (rules.feesPct / 100)
  return {
    id: `est_${hashParams(params, rules.version)}`,
    base,
    effectiveGfa,
    construction,
    packageAmounts,
    elementAmounts,
    location,
    locationFactor,
    storeyFactor,
    slopeFactor,
    estimateClass,
    contingencyPct,
    contingency,
    fees,
    totalMid: construction + contingency + fees,
    featureAmounts,
  }
}

export function runEstimate(params, locations, rules = DEFAULT_RULES) {
  // All prose follows the language of the rules; ids and figures never depend on it.
  const t = i18n.getFixedT(rules.lang ?? 'en')
  const trace = new Map()
  const core = runCore(params, locations, rules)
  const {
    id,
    base,
    effectiveGfa,
    construction,
    packageAmounts,
    elementAmounts,
    location,
    locationFactor,
    storeyFactor,
    slopeFactor,
    estimateClass,
    contingencyPct,
    contingency,
    fees,
    totalMid,
  } = core

  const warnings = []
  if (params.requestedClass > 2) {
    warnings.push({
      code: 'downgraded_class',
      message: t('engine.warnings.downgradedClass'),
      blocksProfessionalExport: false,
    })
  }
  if (params.site.sloping === 'unknown') {
    warnings.push({
      code: 'site_unknown',
      message: t('engine.warnings.siteUnknown'),
      blocksProfessionalExport: false,
    })
  }

  const traceBase = {
    id: `${id}:base`,
    label: t('engine.trace.base.label'),
    value: round(base),
    unit: 'RWF',
    formula: t('engine.trace.base.formula'),
    inputs: [
      { name: t('engine.trace.base.gfa'), value: effectiveGfa, unit: 'm²' },
      {
        name: t('engine.trace.base.baseRate', { typology: params.typology }),
        value: rules.baseRate[params.typology],
        unit: 'RWF/m²',
      },
      { name: t('engine.trace.base.locationFactor', { location: location.name }), value: locationFactor },
      { name: t('engine.trace.base.storeyFactor'), value: Number(storeyFactor.toFixed(3)) },
      { name: t('engine.trace.base.slopeFactor'), value: slopeFactor },
    ],
    assumptions: [t('engine.trace.base.assumption', { version: rules.rulesVersion })],
    lastUpdated: NOW,
    changedBy: 'engine',
    children: [],
  }
  trace.set(traceBase.id, traceBase)

  const elementNodes = []
  for (const pkg of rules.packages) {
    if (!pkg.element) continue
    const q = qualityFor(params, pkg.element)
    const node = {
      id: `${id}:pkg:${pkg.code}`,
      label: `${pkg.code} ${pkg.name}`,
      value: round(packageAmounts.get(pkg.code) ?? 0),
      unit: 'RWF',
      formula: t('engine.trace.pkg.formula'),
      inputs: [
        { name: t('engine.trace.pkg.base'), value: round(base), unit: 'RWF' },
        { name: t('engine.trace.pkg.share'), value: pkg.share },
        { name: t('engine.trace.pkg.qualityMultiplier', { quality: q }), value: multiplierFor(rules, pkg.element, q) },
      ],
      assumptions: [t('engine.trace.pkg.assumption', { quality: q, element: rules.elementNames[pkg.element] })],
      price: {
        priceId: `${PRICE_SNAPSHOT_ID}:${pkg.code}`,
        source: t('engine.trace.pkg.priceSource'),
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
  const featureNodes = core.featureAmounts.map((f) => {
    const node = {
      id: `${id}:feature:${f.id}`,
      label: f.label,
      value: round(f.amount),
      unit: 'RWF',
      formula: t(`engine.trace.feature.${f.kind}`),
      inputs: [{ name: t('engine.trace.feature.locationFactor'), value: locationFactor }],
      assumptions: [t('engine.trace.feature.assumption')],
      lastUpdated: NOW,
      changedBy: 'engine',
      children: [],
    }
    trace.set(node.id, node)
    return node
  })

  const rangePct = rules.classes[estimateClass].rangePct
  const range = (mid) => ({
    low: round(mid * (1 - rangePct / 100)),
    mid: round(mid),
    high: round(mid * (1 + rangePct / 100)),
  })

  // Phases: packages tagged 'spread' (preliminaries) are distributed pro-rata over P1..P9.
  const phaseRaw = new Map()
  for (const code of PHASE_CODES) phaseRaw.set(code, 0)
  let spread = 0
  for (const pkg of rules.packages) {
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
    const amount = withPrelims * (totalMid / construction)
    cumulative += amount
    const months = Math.max(1, Math.round((amount / totalMid) * durationMonths))
    const monthStart = monthCursor
    const monthEnd = Math.min(durationMonths, monthCursor + months)
    monthCursor = monthEnd
    const figureId = `${id}:phase:${code}`
    trace.set(figureId, {
      id: figureId,
      label: t('engine.trace.phase.label', { name: rules.phaseNames[code], code }),
      value: round(amount),
      unit: 'RWF',
      formula: t('engine.trace.phase.formula'),
      inputs: [
        { name: t('engine.trace.phase.packages'), value: round(raw), unit: 'RWF' },
        { name: t('engine.trace.phase.prelims'), value: round(withPrelims - raw), unit: 'RWF' },
      ],
      assumptions: [t('engine.trace.phase.assumption')],
      lastUpdated: NOW,
      changedBy: 'engine',
      children: rules.packages
        .filter((p) => p.phase === code && p.element)
        .map((p) => trace.get(`${id}:pkg:${p.code}`))
        .filter((n) => Boolean(n)),
    })
    return {
      code,
      name: rules.phaseNames[code],
      amount: round(amount),
      pct: Number(((amount / totalMid) * 100).toFixed(1)),
      cumulative: round(cumulative),
      monthStart,
      monthEnd,
      figureId,
    }
  })

  const monthly = new Array(durationMonths + 1).fill(0)
  for (const p of phases) {
    const span = Math.max(1, p.monthEnd - p.monthStart)
    for (let m = p.monthStart; m < p.monthStart + span && m <= durationMonths; m++)
      monthly[m] = (monthly[m] ?? 0) + p.amount / span
  }
  let cum = 0
  const cashFlow = monthly.map((amount, month) => {
    cum += amount
    return { month, amount: round(amount), cumulative: round(cum) }
  })

  const qualityOptions = QUALITY_LEVELS.map((q) => {
    if (q === params.quality && Object.keys(params.elementOverrides).length === 0) {
      return { quality: q, total: range(totalMid), costPerM2: round(totalMid / params.gfa), figureId: `${id}:total` }
    }
    const alt = runCore({ ...params, quality: q, elementOverrides: {} }, locations, rules)
    return {
      quality: q,
      total: range(alt.totalMid),
      costPerM2: round(alt.totalMid / params.gfa),
      figureId: `${alt.id}:total`,
    }
  })

  const elements = [...elementAmounts.entries()].map(([group, amount]) => {
    const pkgCode = rules.packages.find((p) => p.element === group)?.code ?? '13'
    return {
      group,
      name: rules.elementNames[group],
      quality: qualityFor(params, group),
      amount: round(amount),
      packageCode: pkgCode,
      figureId: `${id}:pkg:${pkgCode}`,
    }
  })

  const totalFigureId = `${id}:total`
  trace.set(totalFigureId, {
    id: totalFigureId,
    label: t('engine.trace.total.label'),
    value: round(totalMid),
    unit: 'RWF',
    formula: t('engine.trace.total.formula'),
    inputs: [
      { name: t('engine.trace.total.construction'), value: round(construction), unit: 'RWF' },
      { name: t('engine.trace.total.contingency', { pct: contingencyPct }), value: round(contingency), unit: 'RWF' },
      { name: t('engine.trace.total.fees', { pct: rules.feesPct }), value: round(fees), unit: 'RWF' },
    ],
    assumptions: [
      t('engine.trace.total.range', {
        pct: rangePct,
        class: estimateClass,
        label: rules.classes[estimateClass].label,
      }),
      t('engine.trace.total.exclusions'),
    ],
    lastUpdated: NOW,
    changedBy: 'engine',
    children: [traceBase, ...elementNodes, ...featureNodes],
  })

  if (qualityFor(params, 'floors') === 'PRM') {
    warnings.push({
      code: 'stale_price',
      message: t('engine.warnings.stalePrice', { days: rules.stalePriceDays, materialId: 'MAT-TIL-0021' }),
      blocksProfessionalExport: rules.blockExportOnStalePrices,
    })
  }

  const result = {
    id,
    projectId: null,
    createdAt: NOW,
    estimateClass,
    classLabel: rules.classes[estimateClass].label,
    engineVersion: ENGINE_VERSION,
    rulesVersion: rules.rulesVersion,
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
      {
        key: 'rates',
        text: t('engine.assumptions.rates', { snapshot: PRICE_SNAPSHOT_ID, version: rules.rulesVersion }),
        source: t('engine.assumptions.ratesSource'),
      },
      {
        key: 'location',
        text: t('engine.assumptions.location', { location: location.name, factor: locationFactor.toFixed(2) }),
        source: t('engine.assumptions.locationSource'),
      },
      {
        key: 'storeys',
        text: t('engine.assumptions.storeys', { count: params.storeys, pct: rules.storeyFactorPct }),
      },
      { key: 'prelims', text: t('engine.assumptions.prelims') },
      { key: 'contingency', text: t('engine.assumptions.contingency', { pct: contingencyPct, class: estimateClass }) },
      {
        key: 'fees',
        text: t('engine.assumptions.fees', { pct: rules.feesPct }),
      },
      { key: 'exclusions', text: t('engine.assumptions.exclusions') },
    ],
    warnings,
    totalFigureId,
  }
  return { result, trace }
}

/** Lightweight total for solvers (reverse budget). */
export function runTotal(params, locations, rules = DEFAULT_RULES) {
  const c = runCore(params, locations, rules)
  return { id: c.id, totalMid: c.totalMid }
}
