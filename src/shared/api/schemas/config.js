import { z } from 'zod'
import i18n from '@/shared/i18n'
import { ElementGroupSchema, FeatureFlagSchema, PhaseCodeSchema, QualityLevelSchema, TypologySchema } from './common'
import { RoleSchema } from './auth'

/**
 * Platform configuration — everything an admin can change without a deploy.
 * The engine, the catalogue and the public pages all read from this object.
 * Published versions are immutable; every PUT creates a new version.
 */
/** One text in up to three languages; English is required and is the fallback. */
export const LocalizedStringSchema = z.object({
  en: z.string().min(1, { error: () => i18n.t('validation.englishRequired') }),
  rw: z.string().optional(),
  fr: z.string().optional(),
})

/**
 * Text-bearing parts of the configuration exist in two shapes: the admin edits
 * `LocalizedString`s, visitors receive plain strings resolved for their language.
 * `T` is the text schema used for one shape.
 */
function textSchemas(T) {
  const Branding = z.object({
    appName: z.string().min(2),
    shortName: z.string().min(2).max(12),
    tagline: T,
    region: z.string(),
    currency: z.enum(['RWF', 'USD']),
    supportEmail: z.string().email().or(z.literal('')),
    footerDisclaimer: T,
  })
  const Homepage = z.object({
    eyebrow: T,
    headline: T,
    subheadline: T,
    primaryCta: T,
    stats: z.array(z.object({ value: z.string(), label: T })).max(4),
    steps: z.array(z.object({ title: T, text: T })).max(6),
    showClassesTable: z.boolean(),
    professional: z.object({ title: T, text: T, bullets: z.array(T).max(6), cta: T }),
    example: z.object({
      typology: TypologySchema,
      locationId: z.string(),
      gfa: z.number().positive(),
      storeys: z.number().int().positive(),
      quality: QualityLevelSchema,
    }),
  })
  const Typology = z.object({
    id: TypologySchema,
    label: T,
    enabled: z.boolean(),
    /** Base construction rate per m² at STD quality in the reference location. */
    baseRatePerM2: z.number().positive(),
  })
  const Quality = z.object({ id: QualityLevelSchema, label: T, description: T, multiplier: z.number().positive() })
  const Package = z.object({
    code: z.string().min(1),
    name: T,
    phase: z.union([PhaseCodeSchema, z.literal('spread')]),
    share: z.number().min(0).max(1),
    element: ElementGroupSchema.nullable(),
  })
  const Feature = z.object({
    id: FeatureFlagSchema,
    label: T,
    enabled: z.boolean(),
    fixed: z.number().nonnegative().nullable(),
    perBedroom: z.number().nonnegative().nullable(),
    pctOfBase: z.number().min(0).max(1).nullable(),
    boostGroup: ElementGroupSchema.nullable(),
    boostPct: z.number().min(0).max(500).nullable(),
  })
  const Class = z.object({
    level: z.number().int().min(1).max(5),
    label: T,
    rangePct: z.number().min(0).max(100),
    contingencyPct: z.number().min(0).max(100),
  })
  return {
    Branding,
    Homepage,
    Typology,
    Quality,
    Package,
    Feature,
    Class,
    ElementLabels: z.record(ElementGroupSchema, T),
    PhaseNames: z.record(PhaseCodeSchema, T),
  }
}

const Localized = textSchemas(LocalizedStringSchema)
const Resolved = textSchemas(z.string().min(1))

export const BrandingConfigSchema = Localized.Branding
export const HomepageConfigSchema = Localized.Homepage
export const TypologyConfigSchema = Localized.Typology
export const QualityConfigSchema = Localized.Quality
export const PackageConfigSchema = Localized.Package
export const FeatureConfigSchema = Localized.Feature
export const ClassConfigSchema = Localized.Class

/** Locations are proper nouns and stay in one spelling. */
export const LocationConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  province: z.string(),
  factor: z.number().positive(),
  enabled: z.boolean(),
})

export const FinancialConfigSchema = z.object({
  feesPct: z.number().min(0).max(100),
  vatPct: z.number().min(0).max(100),
  defaultOverheadPct: z.number().min(0).max(100),
  defaultContingencyPct: z.number().min(0).max(100),
  storeyFactorPct: z.number().min(0).max(50),
  slopeFactors: z.object({ gentle: z.number().min(1), steep: z.number().min(1) }),
})

export const WorkflowConfigSchema = z.object({
  stalePriceDays: z.number().int().positive(),
  anomalyThresholdPct: z.number().positive(),
  blockExportOnStalePrices: z.boolean(),
  requireOverrideReason: z.boolean(),
  approveBoqRoles: z.array(RoleSchema),
  maxEssentialQuestions: z.number().int().min(1).max(10),
})

export const LocalizationConfigSchema = z.object({
  defaultLocale: z.enum(['en', 'rw', 'fr']),
  enabledLocales: z.array(z.enum(['en', 'rw', 'fr'])).min(1),
})

export const PlatformConfigSchema = z.object({
  version: z.number().int().nonnegative(),
  updatedAt: z.string(),
  updatedBy: z.string(),
  branding: Localized.Branding,
  homepage: Localized.Homepage,
  typologies: z.array(Localized.Typology).min(1),
  qualities: z.array(Localized.Quality).length(4),
  elementMultipliers: z.partialRecord(ElementGroupSchema, z.record(QualityLevelSchema, z.number().nonnegative())),
  elementLabels: Localized.ElementLabels,
  packages: z.array(Localized.Package).min(1),
  phaseNames: Localized.PhaseNames,
  features: z.array(Localized.Feature),
  locations: z.array(LocationConfigSchema).min(1),
  classes: z.array(Localized.Class).length(5),
  financial: FinancialConfigSchema,
  workflow: WorkflowConfigSchema,
  localization: LocalizationConfigSchema,
  changelog: z.array(z.object({ version: z.number().int(), at: z.string(), by: z.string(), note: z.string() })),
})

/**
 * What anonymous visitors may read: no rates, no shares, no workflow internals.
 * All text is already resolved to the language of the request (`Accept-Language`).
 */
export const PublicConfigSchema = z.object({
  version: z.number().int(),
  branding: Resolved.Branding,
  homepage: Resolved.Homepage,
  typologies: z.array(Resolved.Typology.pick({ id: true, label: true, enabled: true })),
  qualities: z.array(Resolved.Quality.pick({ id: true, label: true, description: true })),
  elementLabels: Resolved.ElementLabels,
  phaseNames: Resolved.PhaseNames,
  features: z.array(Resolved.Feature.pick({ id: true, label: true, enabled: true })),
  locations: z.array(LocationConfigSchema),
  classes: z.array(Resolved.Class),
  localization: LocalizationConfigSchema,
  workflow: WorkflowConfigSchema.pick({ maxEssentialQuestions: true }),
})

export const SaveConfigSchema = z.object({
  config: PlatformConfigSchema.omit({ version: true, updatedAt: true, updatedBy: true, changelog: true }),
  note: z.string().min(3, { error: () => i18n.t('validation.describeChange') }),
})
