'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser } from '@/lib/db/client'
import * as projectQueries from '@/lib/db/queries/projects'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types'

const PROJECTS_QUERY_KEY = ['projects']

/**
 * Hook to fetch all projects for the current user
 */
export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Not authenticated')
      }
      return projectQueries.getProjects(user.id)
    },
    enabled: true,
  })
}

/**
 * Hook to fetch a single project
 */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectQueries.getProject(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Not authenticated')
      }
      return projectQueries.createProject(user.id, input)
    },
    onSuccess: (newProject) => {
      // Update the projects list
      queryClient.setQueryData(PROJECTS_QUERY_KEY, (oldData: Project[] | undefined) => {
        if (!oldData) return [newProject]
        return [newProject, ...oldData]
      })
    },
  })
}

/**
 * Hook to update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) =>
      projectQueries.updateProject(projectId, input),
    onSuccess: (updatedProject) => {
      // Update the specific project
      queryClient.setQueryData(['projects', updatedProject.id], updatedProject)

      // Update the projects list
      queryClient.setQueryData(PROJECTS_QUERY_KEY, (oldData: Project[] | undefined) => {
        if (!oldData) return [updatedProject]
        return oldData.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      })
    },
  })
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => projectQueries.deleteProject(projectId),
    onSuccess: (deletedProject) => {
      // Remove from projects list
      queryClient.setQueryData(PROJECTS_QUERY_KEY, (oldData: Project[] | undefined) => {
        if (!oldData) return []
        return oldData.filter((p) => p.id !== deletedProject.id)
      })

      // Invalidate the specific project
      queryClient.invalidateQueries({ queryKey: ['projects', deletedProject.id] })
    },
  })
}

/**
 * Hook to get project statistics
 */
export function useProjectStats(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'stats'],
    queryFn: () => projectQueries.getProjectStats(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to search projects
 */
export function useSearchProjects(query: string) {
  return useQuery({
    queryKey: ['projects', 'search', query],
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Not authenticated')
      }
      return projectQueries.searchProjects(user.id, query)
    },
    enabled: !!query,
  })
}
