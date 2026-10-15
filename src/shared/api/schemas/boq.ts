import { z } from 'zod'
import { PhaseCodeSchema, PriceProvenanceSchema } from './common'

/** draft → review → approved → issued (Section 12). */
export const BoqStatusSchema = z.enum(['draft', 'review', 'approved', 'issued'])
export type BoqStatus = z.infer<typeof BoqStatusSchema>

export const QuantitySourceSchema = z.enum(['parametric', 'measured', 'manual', 'imported'])
export type QuantitySource = z.infer<typeof QuantitySourceSchema>

export const BoqUnitSchema = z.enum(['m', 'm²', 'm³', 'no.', 'kg', 't', 'sum', 'item', 'PC', 'PS'])
export type BoqUnit = z.infer<typeof BoqUnitSchema>

export const BoqOverrideSchema = z.object({
  qty: z.number().nonnegative().nullable(),
  rate: z.number().nonnegative().nullable(),
  wastePct: z.number().min(0).max(100).nullable(),
  reason: z.string().min(3, 'Give a reason for the override'),
  changedBy: z.string(),
  changedAt: z.string(),
})
export type BoqOverride = z.infer<typeof BoqOverrideSchema>

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
  figureId: z.string(),
})
export type BoqItem = z.infer<typeof BoqItemSchema>

export const BoqBillSchema = z.object({
  code: z.string(),
  name: z.string(),
  phase: PhaseCodeSchema.nullable(),
  items: z.array(BoqItemSchema),
  subtotal: z.number().nonnegative(),
})
export type BoqBill = z.infer<typeof BoqBillSchema>

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
export type Boq = z.infer<typeof BoqSchema>

export const BoqOverrideInputSchema = z.object({
  qty: z.number().nonnegative().nullable().default(null),
  rate: z.number().nonnegative().nullable().default(null),
  wastePct: z.number().min(0).max(100).nullable().default(null),
  reason: z.string().min(3, 'Give a reason for the override'),
})
export type BoqOverrideInput = z.input<typeof BoqOverrideInputSchema>
