import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authApi } from '@/shared/api/endpoints'
import { useAuthStore, useScenarioStore, useUiStore } from '@/shared/stores'

export function useRequestOtp() {
  return useMutation({ mutationFn: (identifier) => authApi.requestOtp(identifier) })
}

export function useVerifyOtp() {
  const setSession = useAuthStore((s) => s.setSession)
  const setMode = useUiStore((s) => s.setMode)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => authApi.verifyOtp(input),
    onSuccess: (session) => {
      setSession(session)
      setMode(['client', 'supplier'].includes(session.user.role) ? 'client' : 'professional')
      void qc.invalidateQueries()
    },
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const clearCompare = useScenarioStore((s) => s.clear)
  const setMode = useUiStore((s) => s.setMode)
  const qc = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => authApi.logout().catch(() => ({ ok: true })),
    onSettled: () => {
      clear()
      clearCompare()
      setMode('client')
      qc.removeQueries({ queryKey: ['projects'] })
      qc.removeQueries({ queryKey: ['catalogue'] })
      void navigate({ to: '/' })
    },
  })
}
