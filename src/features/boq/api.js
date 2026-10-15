import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { boqApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'

import { downloadText } from '@/shared/lib/download'

export const boqQuery = (projectId) =>
  queryOptions({ queryKey: qk.boq(projectId), queryFn: () => boqApi.get(projectId) })
export const useBoq = (projectId) => useQuery(boqQuery(projectId))

export function useOverrideItem(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, input }) => boqApi.override(projectId, itemId, input),
    onSuccess: (boq) => {
      qc.setQueryData(qk.boq(projectId), boq)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}

export function useResetOverride(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId) => boqApi.resetOverride(projectId, itemId),
    onSuccess: (boq) => {
      qc.setQueryData(qk.boq(projectId), boq)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}

export function useTransitionBoq(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status) => boqApi.transition(projectId, status),
    onSuccess: (boq) => {
      qc.setQueryData(qk.boq(projectId), boq)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}

export function useExportBoq(projectId) {
  return useMutation({
    mutationFn: (format) => boqApi.export(projectId, format),
    onSuccess: (res) => downloadText(res.filename, res.content, res.mime),
  })
}

export const boqsQuery = queryOptions({ queryKey: qk.boqs, queryFn: boqApi.list })
export const useBoqs = () => useQuery(boqsQuery)

export function useAddItem(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => boqApi.addItem(projectId, input),
    onSuccess: (boq) => {
      qc.setQueryData(qk.boq(projectId), boq)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}

export function useRemoveItem(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId) => boqApi.removeItem(projectId, itemId),
    onSuccess: (boq) => {
      qc.setQueryData(qk.boq(projectId), boq)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}

export function useSetAdjustments(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => boqApi.setAdjustments(projectId, input),
    onSuccess: (boq) => {
      qc.setQueryData(qk.boq(projectId), boq)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}
