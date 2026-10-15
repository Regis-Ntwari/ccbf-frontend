import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'
import type { CreateProjectInput, EstimateParams } from '@/shared/api/schemas'

export const projectsQuery = (q?: string) => queryOptions({ queryKey: qk.projects(q), queryFn: () => projectApi.list(q) })
export const projectQuery = (id: string) => queryOptions({ queryKey: qk.project(id), queryFn: () => projectApi.get(id) })
export const scenariosQuery = (id: string) => queryOptions({ queryKey: qk.scenarios(id), queryFn: () => projectApi.scenarios(id) })

export const useProjects = (q?: string) => useQuery(projectsQuery(q))
export const useProject = (id: string) => useQuery(projectQuery(id))
export const useScenarios = (id: string) => useQuery(scenariosQuery(id))

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectApi.create(input),
    onSuccess: (project) => {
      qc.setQueryData(qk.project(project.id), project)
      void qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: { name?: string; params?: EstimateParams; status?: 'draft' | 'active' | 'archived' }) => projectApi.update(id, patch),
    onSuccess: (project) => {
      qc.setQueryData(qk.project(project.id), project)
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: qk.boq(id) })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useAddScenario(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, params }: { name: string; params: EstimateParams }) => projectApi.addScenario(projectId, name, params),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.scenarios(projectId) }),
  })
}

export function useRemoveScenario(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sid: string) => projectApi.removeScenario(projectId, sid),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.scenarios(projectId) }),
  })
}
