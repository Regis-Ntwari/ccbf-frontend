/**
 * Mock rule tables for the in-browser estimate engine.
 *
 * These are ILLUSTRATIVE coefficients so the frontend can be developed and
 * demonstrated without a backend. The real engine lives server-side
 * (Section 14.7) and is the only source of truth for numbers in production.
 */
import type { ElementGroup, PhaseCode, QualityLevel, Typology, FeatureFlag } from '@/shared/api/schemas'

export const ENGINE_VERSION = 'mock-engine-0.3.0'
export const RULES_VERSION = 'rules-2026-10'
export const PRICE_SNAPSHOT_ID = 'ps-2026-10-01'

/** Base construction rate per m² at STD quality, Kigali, RWF. */
export const BASE_RATE_PER_M2: Record<Typology, number> = {
  house: 420_000,
  apartments: 480_000,
  shop: 380_000,
  office: 450_000,
  hotel: 650_000,
  school: 360_000,
  other: 420_000,
}

export const QUALITY_MULTIPLIER: Record<QualityLevel, number> = {
  ECO: 0.8,
  STD: 1.0,
  PRM: 1.4,
  LUX: 2.0,
}

/** Element groups with special quality curves (Section 9.1 rows). */
export const SPECIAL_QUALITY_MULTIPLIER: Partial<Record<ElementGroup, Record<QualityLevel, number>>> = {
  hvac: { ECO: 0, STD: 1, PRM: 3, LUX: 5 },
  external: { ECO: 0.5, STD: 1, PRM: 1.8, LUX: 3.5 },
  kitchen: { ECO: 0.6, STD: 1, PRM: 1.8, LUX: 3.2 },
  windows: { ECO: 0.7, STD: 1, PRM: 1.6, LUX: 2.6 },
}

export interface PackageRule {
  code: string
  name: string
  phase: PhaseCode | 'spread'
  /** Share of base construction cost. Element packages are scaled by quality. */
  share: number
  element: ElementGroup | null
}

/** Level-1 packages (Section 5.1) with mock cost shares (sum ≈ 1.00). */
export const PACKAGES: PackageRule[] = [
  { code: '00', name: 'Pre-construction & statutory', phase: 'P0', share: 0.02, element: null },
  { code: '01', name: 'Preliminaries & site management', phase: 'spread', share: 0.05, element: null },
  { code: '02', name: 'Site preparation & earthworks', phase: 'P1', share: 0.02, element: null },
  { code: '03', name: 'Substructure', phase: 'P2', share: 0.12, element: 'structure' },
  { code: '04', name: 'Superstructure frame', phase: 'P3', share: 0.10, element: 'structure' },
  { code: '05', name: 'Envelope: external walls & openings', phase: 'P4', share: 0.09, element: 'walls' },
  { code: '05W', name: 'Windows & glazing', phase: 'P4', share: 0.05, element: 'windows' },
  { code: '05D', name: 'External & internal doors', phase: 'P7', share: 0.03, element: 'doors' },
  { code: '06', name: 'Roof', phase: 'P4', share: 0.09, element: 'roof' },
  { code: '07', name: 'Internal walls & partitions', phase: 'P5', share: 0.02, element: null },
  { code: '08', name: 'Services rough-in', phase: 'P5', share: 0.04, element: 'electrical' },
  { code: '08H', name: 'HVAC provisions', phase: 'P5', share: 0.02, element: 'hvac' },
  { code: '09', name: 'Wet-trade finishes', phase: 'P6', share: 0.06, element: 'wallFinish' },
  { code: '10', name: 'Floor finishes', phase: 'P7', share: 0.07, element: 'floors' },
  { code: '10C', name: 'Ceilings & painting', phase: 'P7', share: 0.03, element: 'ceilings' },
  { code: '11', name: 'Joinery & kitchen', phase: 'P7', share: 0.04, element: 'kitchen' },
  { code: '12', name: 'Sanitary fit-off', phase: 'P7', share: 0.05, element: 'sanitary' },
  { code: '12E', name: 'Electrical fit-off & lighting', phase: 'P7', share: 0.02, element: 'electrical' },
  { code: '13', name: 'External works', phase: 'P8', share: 0.07, element: 'external' },
  { code: '14', name: 'Testing, commissioning & handover', phase: 'P9', share: 0.01, element: null },
]

export const PHASE_NAMES: Record<PhaseCode, string> = {
  P0: 'Pre-construction',
  P1: 'Site preparation',
  P2: 'Foundations',
  P3: 'Structure',
  P4: 'Walls, windows & roof',
  P5: 'Partitions & services rough-in',
  P6: 'Plaster & screed',
  P7: 'Finishes & fit-off',
  P8: 'External works',
  P9: 'Handover',
}

export const ELEMENT_NAMES: Record<ElementGroup, string> = {
  structure: 'Structure',
  walls: 'Walls',
  roof: 'Roof',
  windows: 'Windows',
  doors: 'Doors',
  floors: 'Floors',
  wallFinish: 'Wall finish',
  ceilings: 'Ceilings',
  sanitary: 'Sanitary',
  kitchen: 'Kitchen',
  electrical: 'Electrical',
  hvac: 'HVAC',
  external: 'External',
}

/** Fixed add-ons (RWF, Kigali) for feature flags. Some scale with the design. */
export const FEATURE_RULES: Record<
  FeatureFlag,
  { name: string; fixed?: number; pctOfBase?: number; perBedroom?: number; elementBoost?: { group: ElementGroup; pct: number } }
> = {
  solar: { name: 'Solar PV + water heating', fixed: 5_500_000 },
  generator: { name: 'Standby generator', fixed: 4_000_000 },
  pool: { name: 'Swimming pool', fixed: 28_000_000 },
  ac: { name: 'Air conditioning', perBedroom: 1_200_000 },
  smartHome: { name: 'Smart home package', fixed: 6_000_000 },
  bigWindows: { name: 'Large glazed openings', elementBoost: { group: 'windows', pct: 35 } },
  premiumKitchen: { name: 'Premium kitchen', elementBoost: { group: 'kitchen', pct: 60 } },
  landscaping: { name: 'Landscaping', pctOfBase: 0.03 },
  boundaryWall: { name: 'Boundary wall & gate', fixed: 9_000_000 },
}

/** Range half-width by estimate class (Section 1.4 / Feature 7). */
export const CLASS_RANGE_PCT: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 15, 2: 10, 3: 7, 4: 4, 5: 2 }
export const CLASS_CONTINGENCY_PCT: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 10, 2: 8, 3: 6, 4: 5, 5: 3 }
export const FEES_PCT = 8
export const VAT_PCT = 18
