import { beforeEach, describe, expect, it } from 'vitest'
import { finalizeDraft, useWizardStore } from '../wizard'
import { useScenarioStore } from '../scenario'
import { useAuthStore, selectUser } from '../auth'

beforeEach(() => {
  useWizardStore.getState().reset()
  useScenarioStore.getState().clear()
  useAuthStore.getState().clear()
})

describe('wizard store', () => {
  it('merges draft patches and finalises into engine params', () => {
    const s = useWizardStore.getState()
    s.setDraft({ typology: 'house' })
    s.setDraft({ locationId: 'kigali', gfa: 150 })
    const { params, errors } = finalizeDraft(useWizardStore.getState().draft)
    expect(errors).toBeNull()
    expect(params?.gfa).toBe(150)
    expect(params?.storeys).toBe(1)
  })
  it('reports field-level errors for missing essentials', () => {
    const { params, errors } = finalizeDraft({ typology: 'house' })
    expect(params).toBeNull()
    expect(errors).toHaveProperty('locationId')
    expect(errors).toHaveProperty('gfa')
  })
})

describe('scenario compare tray', () => {
  const entry = (id: string) => ({ estimateId: id, label: id, totalMid: 1, params: finalizeDraft({ typology: 'house', locationId: 'kigali', gfa: 100 }).params! })
  it('dedupes and keeps at most four entries', () => {
    const s = useScenarioStore.getState()
    for (const id of ['a', 'b', 'a', 'c', 'd', 'e']) s.add(entry(id))
    expect(useScenarioStore.getState().compare.map((c) => c.estimateId)).toEqual(['b', 'c', 'd', 'e'])
  })
})

describe('auth store', () => {
  it('treats expired sessions as signed out', () => {
    const user = { id: 'u', name: 'U', email: 'u@x.rw', role: 'client' as const, companyId: null, companyName: null, grants: [] }
    useAuthStore.getState().setSession({ token: 't', expiresAt: new Date(Date.now() - 1000).toISOString(), user })
    expect(selectUser(useAuthStore.getState())).toBeNull()
    useAuthStore.getState().setSession({ token: 't', expiresAt: new Date(Date.now() + 1000).toISOString(), user })
    expect(selectUser(useAuthStore.getState())?.id).toBe('u')
  })
})
