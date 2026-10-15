import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'

export const projectsQuery = (q) => queryOptions({ queryKey: qk.projects(q), queryFn: () => projectApi.list(q) })
export const projectQuery = (id) => queryOptions({ queryKey: qk.project(id), queryFn: () => projectApi.get(id) })
export const scenariosQuery = (id) =>
  queryOptions({ queryKey: qk.scenarios(id), queryFn: () => projectApi.scenarios(id) })

export const useProjects = (q) => useQuery(projectsQuery(q))
export const useProject = (id) => useQuery(projectQuery(id))
export const useScenarios = (id) => useQuery(scenariosQuery(id))

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => projectApi.create(input),
    onSuccess: (project) => {
      qc.setQueryData(qk.project(project.id), project)
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}

export function useUpdateProject(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch) => projectApi.update(id, patch),
    onSuccess: (project) => {
      qc.setQueryData(qk.project(project.id), project)
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
      void qc.invalidateQueries({ queryKey: qk.boq(id) })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => projectApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['boqs'] })
    },
  })
}

export function useAddScenario(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, params }) => projectApi.addScenario(projectId, name, params),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.scenarios(projectId) }),
  })
}

export function useRemoveScenario(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sid) => projectApi.removeScenario(projectId, sid),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.scenarios(projectId) }),
  })
}
