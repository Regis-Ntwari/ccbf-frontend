import { describe, expect, it } from 'vitest'
import { EstimateParamsSchema, ReverseBudgetRequestSchema, BoqOverrideInputSchema, RequestOtpSchema } from '../schemas'

describe('EstimateParamsSchema', () => {
  it('applies defaults for optional questionnaire answers', () => {
    const p = EstimateParamsSchema.parse({ typology: 'house', locationId: 'kigali', gfa: 120, storeys: 1 })
    expect(p.quality).toBe('STD')
    expect(p.features).toEqual([])
    expect(p.site.sloping).toBe('unknown')
    expect(p.requestedClass).toBe(1)
  })
  it('rejects impossible sizes with a readable message', () => {
    const r = EstimateParamsSchema.safeParse({ typology: 'house', locationId: 'kigali', gfa: 5, storeys: 1 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Minimum 20 m²')
  })
  it('only accepts known element groups and quality levels in overrides', () => {
    expect(EstimateParamsSchema.safeParse({ typology: 'house', locationId: 'kigali', gfa: 100, storeys: 1, elementOverrides: { roof: 'LUX' } }).success).toBe(true)
    expect(EstimateParamsSchema.safeParse({ typology: 'house', locationId: 'kigali', gfa: 100, storeys: 1, elementOverrides: { roof: 'GOLD' } }).success).toBe(false)
  })
})

describe('other input schemas', () => {
  it('reverse budget needs a positive budget', () => {
    expect(ReverseBudgetRequestSchema.safeParse({ budget: 0, locationId: 'kigali' }).success).toBe(false)
    expect(ReverseBudgetRequestSchema.parse({ budget: 1, locationId: 'kigali' }).typology).toBe('house')
  })
  it('BOQ override requires a reason', () => {
    expect(BoqOverrideInputSchema.safeParse({ qty: 10, reason: '' }).success).toBe(false)
    expect(BoqOverrideInputSchema.safeParse({ qty: 10, reason: 'Site measure' }).success).toBe(true)
  })
  it('OTP identifier accepts email or phone', () => {
    expect(RequestOtpSchema.safeParse({ identifier: 'a@b.rw' }).success).toBe(true)
    expect(RequestOtpSchema.safeParse({ identifier: '+250788123456' }).success).toBe(true)
    expect(RequestOtpSchema.safeParse({ identifier: 'nope' }).success).toBe(false)
  })
})
