import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { boqApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'
import type { BoqOverrideInput, BoqStatus } from '@/shared/api/schemas'
import { downloadText } from '@/shared/lib/download'

export const boqQuery = (projectId: string) => queryOptions({ queryKey: qk.boq(projectId), queryFn: () => boqApi.get(projectId) })
export const useBoq = (projectId: string) => useQuery(boqQuery(projectId))

export function useOverrideItem(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: BoqOverrideInput }) => boqApi.override(projectId, itemId, input),
    onSuccess: (boq) => qc.setQueryData(qk.boq(projectId), boq),
  })
}

export function useResetOverride(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => boqApi.resetOverride(projectId, itemId),
    onSuccess: (boq) => qc.setQueryData(qk.boq(projectId), boq),
  })
}

export function useTransitionBoq(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: BoqStatus) => boqApi.transition(projectId, status),
    onSuccess: (boq) => qc.setQueryData(qk.boq(projectId), boq),
  })
}

export function useExportBoq(projectId: string) {
  return useMutation({
    mutationFn: (format: 'csv' | 'xlsx' | 'pdf') => boqApi.export(projectId, format),
    onSuccess: (res) => downloadText(res.filename, res.content, res.mime),
  })
}
