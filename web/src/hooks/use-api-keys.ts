'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser } from '@/lib/db/client'
import type { APIKeyWithoutSecret } from '@/types'

const API_KEYS_QUERY_KEY = ['api-keys']

/**
 * Hook to fetch all API keys for the current user
 */
export function useAPIKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/api-keys')
      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }

      const data = await response.json()
      return data.data as APIKeyWithoutSecret[]
    },
  })
}

/**
 * Hook to add a new API key
 */
export function useAddAPIKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { provider: string; apiKey: string; keyName?: string }) => {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add API key')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })
}

/**
 * Hook to delete an API key
 */
export function useDeleteAPIKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete API key')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })
}

/**
 * Hook to test an API key
 */
export function useTestAPIKey() {
  return useMutation({
    mutationFn: async (input: { provider: string; keyId?: string; apiKey?: string }) => {
      const response = await fetch('/api/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to test API key')
      }

      return response.json()
    },
  })
}

/**
 * Hook to update API key status
 */
export function useUpdateAPIKeyStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { keyId: string; isActive: boolean }) => {
      const response = await fetch(`/api/api-keys/${input.keyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: input.isActive }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update API key')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })
}
