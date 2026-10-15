import { z } from 'zod'
import i18n from '@/shared/i18n'
import { PhaseCodeSchema, PriceProvenanceSchema } from './common'

/** draft → review → approved → issued (Section 12). */
export const BoqStatusSchema = z.enum(['draft', 'review', 'approved', 'issued'])

export const QuantitySourceSchema = z.enum(['parametric', 'measured', 'manual', 'imported'])

export const BoqUnitSchema = z.enum(['m', 'm²', 'm³', 'no.', 'kg', 't', 'sum', 'item', 'PC', 'PS'])

export const BoqOverrideSchema = z.object({
  qty: z.number().nonnegative().nullable(),
  rate: z.number().nonnegative().nullable(),
  wastePct: z.number().min(0).max(100).nullable(),
  reason: z.string().min(3, { error: () => i18n.t('validation.overrideReason') }),
  changedBy: z.string(),
  changedAt: z.string(),
})

export const BoqItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  billCode: z.string(),
  phase: PhaseCodeSchema,
  trade: z.string(),
  description: z.string(),
  unit: BoqUnitSchema,
  qty: z.number().nonnegative(),
  qtySource: QuantitySourceSchema,
  formula: z.string().nullable(),
  wastePct: z.number().min(0).max(100),
  rate: z.number().nonnegative(),
  rateProvenance: PriceProvenanceSchema.nullable(),
  amount: z.number().nonnegative(),
  override: BoqOverrideSchema.nullable(),
  /** True for activities added by hand in the estimation workspace. */
  custom: z.boolean().default(false),
  figureId: z.string(),
})

export const BoqBillSchema = z.object({
  code: z.string(),
  name: z.string(),
  phase: PhaseCodeSchema.nullable(),
  items: z.array(BoqItemSchema),
  subtotal: z.number().nonnegative(),
})

export const BoqSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  estimateId: z.string(),
  version: z.number().int().positive(),
  status: BoqStatusSchema,
  classLabel: z.string(),
  currency: z.enum(['RWF', 'USD']),
  bills: z.array(BoqBillSchema),
  measuredSubtotal: z.number(),
  overheadPct: z.number(),
  overhead: z.number(),
  contingencyPct: z.number(),
  contingency: z.number(),
  vatPct: z.number(),
  vat: z.number(),
  grandTotal: z.number(),
  /** Export is blocked while any rate is stale or missing (AC 5). */
  exportBlockedReasons: z.array(z.string()),
  updatedAt: z.string(),
  updatedBy: z.string(),
})

export const BoqOverrideInputSchema = z.object({
  qty: z.number().nonnegative().nullable().default(null),
  rate: z.number().nonnegative().nullable().default(null),
  wastePct: z.number().min(0).max(100).nullable().default(null),
  reason: z.string().min(3, { error: () => i18n.t('validation.overrideReason') }),
})

/** Project-level cost adjustments applied in the estimation workspace. */
export const BoqAdjustmentsSchema = z.object({
  overheadPct: z.number().min(0).max(50),
  contingencyPct: z.number().min(0).max(50),
  vatPct: z.number().min(0).max(30),
})

/** A construction activity added by hand to a work section. */
export const BoqCustomItemInputSchema = z.object({
  billCode: z.string().min(1),
  description: z.string().min(3, { error: () => i18n.t('validation.describeActivity') }),
  trade: z.string().min(1).default('Custom'),
  unit: BoqUnitSchema,
  qty: z.number().nonnegative(),
  rate: z.number().nonnegative(),
  wastePct: z.number().min(0).max(100).default(0),
})

export const BoqSummarySchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  locationName: z.string(),
  version: z.number().int(),
  status: BoqStatusSchema,
  grandTotal: z.number(),
  itemCount: z.number().int(),
  blocked: z.boolean(),
  updatedAt: z.string(),
})
