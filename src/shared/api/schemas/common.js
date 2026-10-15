import { z } from 'zod'

/** Building typologies offered on the landing page (Section 10, step 1). */
export const TypologySchema = z.enum(['house', 'apartments', 'shop', 'office', 'hotel', 'school', 'other'])

/** Four quality levels, defined per element group (Section 9). */
export const QualityLevelSchema = z.enum(['ECO', 'STD', 'PRM', 'LUX'])

export const QUALITY_LEVELS = QualityLevelSchema.options

/** Element groups that can carry a quality override (Section 9.1). */
export const ElementGroupSchema = z.enum([
  'structure',
  'walls',
  'roof',
  'windows',
  'doors',
  'floors',
  'wallFinish',
  'ceilings',
  'sanitary',
  'kitchen',
  'electrical',
  'hvac',
  'external',
])

export const ELEMENT_GROUPS = ElementGroupSchema.options

/** Feature flags from questionnaire step 8. */
export const FeatureFlagSchema = z.enum([
  'solar',
  'generator',
  'pool',
  'ac',
  'smartHome',
  'bigWindows',
  'premiumKitchen',
  'landscaping',
  'boundaryWall',
])

export const FEATURE_FLAGS = FeatureFlagSchema.options

/** Construction phases P0..P9 (Section 5.1). */
export const PhaseCodeSchema = z.enum(['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'])

export const PHASE_CODES = PhaseCodeSchema.options

/** Estimate classes 1..5 (Section 1.4). Level 1 is never shown as a BOQ. */
export const EstimateClassSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])

export const ESTIMATE_CLASS_LABEL = {
  1: 'Rough budget',
  2: 'Preliminary estimate',
  3: 'Design-stage estimate',
  4: 'Professional BOQ (unverified until signed)',
  5: 'Tender BOQ',
}

/** Low / most-likely / high money range. */
export const MoneyRangeSchema = z.object({
  low: z.number().nonnegative(),
  mid: z.number().nonnegative(),
  high: z.number().nonnegative(),
})

export const CurrencySchema = z.enum(['RWF', 'USD'])

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  province: z.string(),
  /** Price factor relative to Kigali = 1.00 (Feature 10). */
  factor: z.number().positive(),
})

/** Provenance attached to any rate (Feature 9). */
export const PriceProvenanceSchema = z.object({
  priceId: z.string(),
  source: z.string(),
  sourceDate: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  verified: z.boolean(),
  stale: z.boolean(),
})

export const PaginatedSchema = (item) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
