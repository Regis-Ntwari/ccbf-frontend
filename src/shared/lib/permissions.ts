import type { Role, User } from '@/shared/api/schemas'

/** Capabilities from the Section 2 permissions matrix. */
export type Capability =
  | 'create_project'
  | 'run_estimate'
  | 'view_rates'
  | 'edit_overrides'
  | 'edit_company_rates'
  | 'approve_boq'
  | 'export_boq'
  | 'submit_prices'
  | 'approve_global_prices'
  | 'edit_global_rules'
  | 'manage_users'
  | 'view_audit'
  | 'professional_mode'
  | 'enterprise_mode'
  | 'admin_panel'

const MATRIX: Record<Capability, Role[] | 'all'> = {
  create_project: ['client', 'architect', 'engineer', 'qs', 'contractor', 'pm', 'company_admin', 'platform_admin'],
  run_estimate: ['client', 'architect', 'engineer', 'qs', 'contractor', 'pm', 'company_admin', 'platform_admin'],
  view_rates: ['architect', 'engineer', 'qs', 'contractor', 'pm', 'company_admin', 'platform_admin'],
  edit_overrides: ['architect', 'engineer', 'qs', 'contractor', 'company_admin', 'platform_admin'],
  edit_company_rates: ['company_admin', 'platform_admin'],
  approve_boq: ['qs', 'contractor', 'company_admin'],
  export_boq: ['architect', 'engineer', 'qs', 'contractor', 'pm', 'company_admin', 'platform_admin'],
  submit_prices: 'all',
  approve_global_prices: ['platform_admin'],
  edit_global_rules: ['platform_admin'],
  manage_users: ['company_admin', 'platform_admin'],
  view_audit: ['architect', 'engineer', 'qs', 'contractor', 'pm', 'company_admin', 'platform_admin'],
  professional_mode: ['architect', 'engineer', 'qs', 'contractor', 'pm', 'company_admin', 'platform_admin'],
  enterprise_mode: ['company_admin', 'platform_admin', 'qs', 'contractor'],
  admin_panel: ['platform_admin', 'company_admin'],
}

export function can(user: User | null, capability: Capability): boolean {
  if (!user) return capability === 'run_estimate'
  const allowed = MATRIX[capability]
  if (allowed === 'all') return true
  if (allowed.includes(user.role)) return true
  // Grants extend the role defaults ("if granted" cells of the matrix).
  if (capability === 'approve_boq' && user.grants.includes('approve_boq')) return true
  if (capability === 'edit_company_rates' && user.grants.includes('edit_company_rates') && ['qs', 'contractor'].includes(user.role)) return true
  return false
}

export const ROLE_LABEL: Record<Role, string> = {
  client: 'Client / owner',
  architect: 'Architect',
  engineer: 'Engineer',
  qs: 'Quantity surveyor',
  contractor: 'Contractor',
  pm: 'Project manager',
  supplier: 'Supplier',
  company_admin: 'Company admin',
  platform_admin: 'Platform admin',
}
