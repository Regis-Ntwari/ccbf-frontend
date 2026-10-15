import { z } from 'zod'
import i18n from '@/shared/i18n'
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

export const PriceStatusSchema = z.enum(['pending', 'approved', 'rejected', 'flagged'])

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

export const PriceSubmissionSchema = z.object({
  materialId: z.string().min(1),
  price: z.number().positive({ error: () => i18n.t('validation.enterPrice') }),
  locationId: z.string().min(1),
  source: z.string().min(2, { error: () => i18n.t('validation.nameSource') }),
  sourceDate: z.string().min(1),
})

export const PriceDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().optional(),
})
