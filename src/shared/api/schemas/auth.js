import { z } from 'zod'
import i18n from '@/shared/i18n'

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

export const SessionSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: UserSchema,
})

export const RequestOtpSchema = z.object({
  identifier: z
    .string()
    .min(3, { error: () => i18n.t('validation.identifier') })
    .refine((v) => /^\S+@\S+\.\S+$/.test(v) || /^\+?[0-9]{9,15}$/.test(v), {
      error: () => i18n.t('validation.identifierFormat'),
    }),
})
export const VerifyOtpSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().length(6, { error: () => i18n.t('validation.codeLength') }),
})
