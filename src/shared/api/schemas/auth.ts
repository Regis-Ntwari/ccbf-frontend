import { z } from 'zod'

/** Roles from Section 2. */
export const RoleSchema = z.enum([
  'client',
  'architect',
  'engineer',
  'qs',
  'contractor',
  'pm',
  'supplier',
  'company_admin',
  'platform_admin',
])
export type Role = z.infer<typeof RoleSchema>

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  companyId: z.string().nullable(),
  companyName: z.string().nullable(),
  /** Granted capabilities beyond the role default (e.g. approve BOQ). */
  grants: z.array(z.enum(['approve_boq', 'edit_company_rates'])).default([]),
})
export type User = z.infer<typeof UserSchema>

export const SessionSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: UserSchema,
})
export type Session = z.infer<typeof SessionSchema>

export const RequestOtpSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Enter your email or phone')
    .refine(
      (v) => /^\S+@\S+\.\S+$/.test(v) || /^\+?[0-9]{9,15}$/.test(v),
      'Enter a valid email or phone number',
    ),
})
export const VerifyOtpSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().length(6, 'The code has 6 digits'),
})
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>
