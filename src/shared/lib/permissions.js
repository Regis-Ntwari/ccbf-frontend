/** Capabilities from the Section 2 permissions matrix. */

const MATRIX = {
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

export function can(user, capability) {
  if (!user) return capability === 'run_estimate'
  const allowed = MATRIX[capability]
  if (allowed === 'all') return true
  if (allowed.includes(user.role)) return true
  // Grants extend the role defaults ("if granted" cells of the matrix).
  if (capability === 'approve_boq' && user.grants.includes('approve_boq')) return true
  if (
    capability === 'edit_company_rates' &&
    user.grants.includes('edit_company_rates') &&
    ['qs', 'contractor'].includes(user.role)
  )
    return true
  return false
}

export const ROLE_LABEL = {
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

/** Localised role name: `roleLabel(t, user.role)`. Falls back to the English constant for unknown roles. */
export function roleLabel(t, role) {
  return t(`shell.roles.${role}`, { defaultValue: ROLE_LABEL[role] ?? role })
}
