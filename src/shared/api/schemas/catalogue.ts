import { z } from 'zod'
import { QualityLevelSchema } from './common'

export const MaterialCategorySchema = z.enum([
  'Cement',
  'Aggregate',
  'Steel',
  'Masonry',
  'Timber',
  'Roofing',
  'Tiles',
  'Paint',
  'Plumbing',
  'Electrical',
  'Joinery',
  'Glazing',
  'Labour',
  'Plant',
])
export type MaterialCategory = z.infer<typeof MaterialCategorySchema>

export const PriceStatusSchema = z.enum(['pending', 'approved', 'rejected', 'flagged'])
export type PriceStatus = z.infer<typeof PriceStatusSchema>

/** A price record in the global or company price database (Section 6). */
export const PriceRecordSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  category: MaterialCategorySchema,
  name: z.string(),
  spec: z.string(),
  baseUnit: z.string(),
  purchaseUnit: z.string(),
  quality: QualityLevelSchema,
  wastePct: z.number().min(0).max(100),
  price: z.number().nonnegative(),
  currency: z.enum(['RWF', 'USD']),
  locationId: z.string(),
  source: z.string(),
  sourceDate: z.string(),
  verified: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
  status: PriceStatusSchema,
  submittedBy: z.string(),
  /** Percent deviation from the current approved price, used to flag anomalies. */
  anomalyPct: z.number().nullable(),
  companyId: z.string().nullable(),
})
export type PriceRecord = z.infer<typeof PriceRecordSchema>

export const PriceSubmissionSchema = z.object({
  materialId: z.string().min(1),
  price: z.number().positive('Enter a price'),
  locationId: z.string().min(1),
  source: z.string().min(2, 'Name the source (supplier, quote…)'),
  sourceDate: z.string().min(1),
})
export type PriceSubmissionInput = z.input<typeof PriceSubmissionSchema>

export const PriceDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().optional(),
})
export type PriceDecision = z.infer<typeof PriceDecisionSchema>
