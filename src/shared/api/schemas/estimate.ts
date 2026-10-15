import { z } from 'zod'
import {
  CurrencySchema,
  ElementGroupSchema,
  EstimateClassSchema,
  FeatureFlagSchema,
  MoneyRangeSchema,
  PhaseCodeSchema,
  QualityLevelSchema,
  TypologySchema,
} from './common'

/**
 * Inputs to the estimate engine. Mirrors the client questionnaire (Section 10)
 * and is also what professionals edit at Level 2+.
 */
export const EstimateParamsSchema = z.object({
  typology: TypologySchema,
  locationId: z.string().min(1, 'Choose a location'),
  /** Gross floor area in m². */
  gfa: z.number().min(20, 'Minimum 20 m²').max(50_000, 'Maximum 50,000 m²'),
  storeys: z.number().int().min(1).max(30),
  bedrooms: z.number().int().min(0).max(50).default(0),
  bathrooms: z.number().int().min(0).max(50).default(0),
  rooms: z
    .object({
      garage: z.boolean().default(false),
      office: z.boolean().default(false),
      store: z.boolean().default(false),
      separateKitchen: z.boolean().default(false),
    })
    .default({ garage: false, office: false, store: false, separateKitchen: false }),
  quality: QualityLevelSchema.default('STD'),
  elementOverrides: z.partialRecord(ElementGroupSchema, QualityLevelSchema).default({}),
  features: z.array(FeatureFlagSchema).default([]),
  site: z
    .object({
      ownsLand: z.boolean().nullable().default(null),
      plotSizeM2: z.number().positive().nullable().default(null),
      sloping: z.enum(['flat', 'gentle', 'steep', 'unknown']).default('unknown'),
    })
    .default({ ownsLand: null, plotSizeM2: null, sloping: 'unknown' }),
  budget: z.number().positive().nullable().default(null),
  targetCompletionMonths: z.number().int().positive().nullable().default(null),
  /** Requested estimate class; engine may downgrade if inputs are missing. */
  requestedClass: EstimateClassSchema.default(1),
})
export type EstimateParams = z.infer<typeof EstimateParamsSchema>
export type EstimateParamsInput = z.input<typeof EstimateParamsSchema>

export const PhaseCostSchema = z.object({
  code: PhaseCodeSchema,
  name: z.string(),
  amount: z.number().nonnegative(),
  pct: z.number().min(0).max(100),
  cumulative: z.number().nonnegative(),
  /** Typical month range during which this phase is paid (for cash flow). */
  monthStart: z.number().int().nonnegative(),
  monthEnd: z.number().int().nonnegative(),
  figureId: z.string(),
})
export type PhaseCost = z.infer<typeof PhaseCostSchema>

export const ElementCostSchema = z.object({
  group: ElementGroupSchema,
  name: z.string(),
  quality: QualityLevelSchema,
  amount: z.number().nonnegative(),
  /** Level-1 package code this element rolls into (Section 5.1). */
  packageCode: z.string(),
  figureId: z.string(),
})
export type ElementCost = z.infer<typeof ElementCostSchema>

export const QualityOptionSchema = z.object({
  quality: QualityLevelSchema,
  total: MoneyRangeSchema,
  costPerM2: z.number().nonnegative(),
  figureId: z.string(),
})
export type QualityOption = z.infer<typeof QualityOptionSchema>

export const AssumptionSchema = z.object({
  key: z.string(),
  text: z.string(),
  source: z.string().optional(),
})
export type Assumption = z.infer<typeof AssumptionSchema>

export const EstimateWarningSchema = z.object({
  code: z.enum(['stale_price', 'missing_price', 'downgraded_class', 'site_unknown']),
  message: z.string(),
  blocksProfessionalExport: z.boolean(),
})
export type EstimateWarning = z.infer<typeof EstimateWarningSchema>

export const CashFlowPointSchema = z.object({
  month: z.number().int().nonnegative(),
  amount: z.number().nonnegative(),
  cumulative: z.number().nonnegative(),
})

/** Output of the deterministic engine. Everything on screen comes from here. */
export const EstimateResultSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable(),
  createdAt: z.string(),
  estimateClass: EstimateClassSchema,
  classLabel: z.string(),
  engineVersion: z.string(),
  rulesVersion: z.string(),
  priceSnapshotId: z.string(),
  currency: CurrencySchema,
  params: EstimateParamsSchema,
  total: MoneyRangeSchema,
  constructionCost: MoneyRangeSchema,
  feesAndTaxes: z.number().nonnegative(),
  contingency: z.number().nonnegative(),
  costPerM2: z.number().nonnegative(),
  durationMonths: z.number().int().positive(),
  phases: z.array(PhaseCostSchema),
  elements: z.array(ElementCostSchema),
  qualityOptions: z.array(QualityOptionSchema),
  cashFlow: z.array(CashFlowPointSchema),
  assumptions: z.array(AssumptionSchema),
  warnings: z.array(EstimateWarningSchema),
  totalFigureId: z.string(),
})
export type EstimateResult = z.infer<typeof EstimateResultSchema>

/** One node of the trace tree ("why this number", Feature 8). */
export const TraceNodeSchema: z.ZodType<TraceNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    value: z.number(),
    unit: z.string(),
    formula: z.string().optional(),
    inputs: z.array(z.object({ name: z.string(), value: z.union([z.number(), z.string()]), unit: z.string().optional() })),
    assumptions: z.array(z.string()),
    wastePct: z.number().optional(),
    price: z
      .object({
        priceId: z.string(),
        source: z.string(),
        sourceDate: z.string(),
        confidence: z.enum(['high', 'medium', 'low']),
        verified: z.boolean(),
      })
      .optional(),
    lastUpdated: z.string(),
    changedBy: z.string(),
    children: z.array(TraceNodeSchema),
  }),
)
export interface TraceNode {
  id: string
  label: string
  value: number
  unit: string
  formula?: string | undefined
  inputs: Array<{ name: string; value: number | string; unit?: string | undefined }>
  assumptions: string[]
  wastePct?: number | undefined
  price?:
    | {
        priceId: string
        source: string
        sourceDate: string
        confidence: 'high' | 'medium' | 'low'
        verified: boolean
      }
    | undefined
  lastUpdated: string
  changedBy: string
  children: TraceNode[]
}

/* ---------- Reverse budget (J2) ---------- */
export const ReverseBudgetRequestSchema = z.object({
  budget: z.number().positive('Enter a budget'),
  locationId: z.string().min(1),
  typology: TypologySchema.default('house'),
  ownsLand: z.boolean().default(true),
})
export type ReverseBudgetRequest = z.infer<typeof ReverseBudgetRequestSchema>
export type ReverseBudgetRequestInput = z.input<typeof ReverseBudgetRequestSchema>

export const ReverseBudgetOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  params: EstimateParamsSchema,
  total: MoneyRangeSchema,
  /** How much of this design the budget covers (100 = fully funded). */
  completionPct: z.number().min(0).max(100),
  /** |total.mid - budget| / budget, used to prove the ±1% re-validation. */
  budgetDeviationPct: z.number(),
})
export type ReverseBudgetOption = z.infer<typeof ReverseBudgetOptionSchema>

export const ReverseBudgetResultSchema = z.object({
  budget: z.number(),
  options: z.array(ReverseBudgetOptionSchema).min(2).max(4),
})
export type ReverseBudgetResult = z.infer<typeof ReverseBudgetResultSchema>

/* ---------- Stage reach (J3) ---------- */
export const StageReachRequestSchema = z.object({
  params: EstimateParamsSchema,
  budget: z.number().positive(),
})
export type StageReachRequest = z.infer<typeof StageReachRequestSchema>

export const StageStatusSchema = z.enum(['complete', 'partial', 'unfunded'])
export const StageReachResultSchema = z.object({
  estimateId: z.string(),
  budget: z.number(),
  stages: z.array(
    z.object({
      code: PhaseCodeSchema,
      name: z.string(),
      cost: z.number(),
      cumulative: z.number(),
      status: StageStatusSchema,
      fundedPct: z.number().min(0).max(100),
    }),
  ),
  overallPct: z.number().min(0).max(100),
  /** What funding the next 25 % of the build would cost. */
  nextQuarterCost: z.number(),
  shortfallToComplete: z.number(),
})
export type StageReachResult = z.infer<typeof StageReachResultSchema>

/* ---------- Cost to complete (J4) ---------- */
export const CostToCompleteRequestSchema = z.object({
  params: EstimateParamsSchema,
  phaseProgress: z.partialRecord(PhaseCodeSchema, z.number().min(0).max(100)),
  amountSpent: z.number().nonnegative(),
})
export type CostToCompleteRequest = z.infer<typeof CostToCompleteRequestSchema>

export const CostToCompleteResultSchema = z.object({
  estimateId: z.string(),
  valueOfWorkDone: z.number(),
  amountSpent: z.number(),
  /** spent − value of work done; positive means over-spent so far. */
  varianceToDate: z.number(),
  remainingCost: MoneyRangeSchema,
  forecastTotal: MoneyRangeSchema,
  shortfall: z.number().nullable(),
  phases: z.array(
    z.object({
      code: PhaseCodeSchema,
      name: z.string(),
      budget: z.number(),
      progressPct: z.number(),
      remaining: z.number(),
    }),
  ),
})
export type CostToCompleteResult = z.infer<typeof CostToCompleteResultSchema>

/* ---------- Natural-language parse (Feature 6) ---------- */
export const ParseIntentResultSchema = z.object({
  /** Partial params extracted. The AI layer never produces numbers for costs. */
  extracted: EstimateParamsSchema.partial(),
  /** Essentials still missing (max 3 asked). */
  missing: z.array(z.enum(['typology', 'locationId', 'gfa', 'storeys'])),
  provenance: z.enum(['rules', 'llm']),
})
export type ParseIntentResult = z.infer<typeof ParseIntentResultSchema>
