'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Generation } from '@/types'

const GENERATIONS_QUERY_KEY = (projectId: string) => ['generations', projectId]
const GENERATION_STATS_KEY = (projectId: string) => ['generation-stats', projectId]

/**
 * Hook to fetch all generations for a project
 */
export function useGenerations(projectId: string) {
  return useQuery({
    queryKey: GENERATIONS_QUERY_KEY(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/generations?projectId=${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch generations')
      }
      const data = await response.json()
      return data.data as Generation[]
    },
  })
}

/**
 * Hook to fetch generation statistics
 */
export function useGenerationStats(projectId: string) {
  return useQuery({
    queryKey: GENERATION_STATS_KEY(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/generations/stats?projectId=${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch generation stats')
      }
      const data = await response.json()
      return data.data
    },
  })
}

/**
 * Hook to create a new generation
 */
export function useCreateGeneration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      projectId: string
      generationType: 'text' | 'image' | 'video' | 'audio'
      provider?: string
      model?: string
      prompt: string
      parameters?: Record<string, any>
    }) => {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create generation')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate both generations list and stats
      queryClient.invalidateQueries({
        queryKey: GENERATIONS_QUERY_KEY(data.data.project_id),
      })
      queryClient.invalidateQueries({
        queryKey: GENERATION_STATS_KEY(data.data.project_id),
      })
    },
  })
}

/**
 * Hook to estimate generation cost
 */
export function useEstimateCost() {
  return useMutation({
    mutationFn: async (input: {
      provider?: string
      model: string
      generationType: 'text' | 'image' | 'video' | 'audio'
      prompt: string
      parameters?: Record<string, any>
    }) => {
      const response = await fetch('/api/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to estimate cost')
      }

      return response.json()
    },
  })
}

/**
 * Hook to get available models for a provider
 */
export function useProviderModels(provider: string) {
  return useQuery({
    queryKey: ['provider-models', provider],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${provider}/models`)
      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }
      const data = await response.json()
      return data.data as string[]
    },
    enabled: !!provider,
  })
}
