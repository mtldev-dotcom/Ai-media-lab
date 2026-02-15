/**
 * Database queries for generations (AI API calls)
 */

import { supabase } from '@/lib/db/client'
import type { Generation } from '@/types'

/**
 * Get all generations for a project
 */
export async function getGenerations(projectId: string): Promise<Generation[]> {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []) as unknown as Generation[]
  } catch (error) {
    console.error('Error fetching generations:', error)
    throw error
  }
}

/**
 * Get a single generation by ID
 */
export async function getGeneration(generationId: string): Promise<Generation> {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single()

    if (error) {
      throw error
    }

    return data as unknown as Generation
  } catch (error) {
    console.error('Error fetching generation:', error)
    throw error
  }
}

/**
 * Create a new generation record
 */
export async function createGeneration(
  userId: string,
  projectId: string,
  data: {
    provider: string
    model: string
    generation_type: string
    prompt: string
    parameters?: Record<string, any>
  }
): Promise<Generation> {
  try {
    const { data: result, error } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        project_id: projectId,
        provider: data.provider,
        model: data.model,
        generation_type: data.generation_type,
        prompt: data.prompt,
        parameters: data.parameters || {},
        status: 'processing',
        cost_cents: 0,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return result as unknown as Generation
  } catch (error) {
    console.error('Error creating generation:', error)
    throw error
  }
}

/**
 * Update generation with results
 */
export async function updateGenerationResult(
  generationId: string,
  data: {
    status: 'completed' | 'failed'
    result?: Record<string, any>
    error_message?: string
    tokens_input?: number
    tokens_output?: number
    tokens_total?: number
    cost_cents?: number
    duration_ms?: number
  }
): Promise<Generation> {
  try {
    const { data: result, error } = await supabase
      .from('generations')
      .update({
        status: data.status,
        result: data.result,
        error_message: data.error_message,
        tokens_input: data.tokens_input,
        tokens_output: data.tokens_output,
        tokens_total: data.tokens_total,
        cost_cents: data.cost_cents,
        duration_ms: data.duration_ms,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', generationId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return result as unknown as Generation
  } catch (error) {
    console.error('Error updating generation:', error)
    throw error
  }
}

/**
 * Get generation statistics for a project
 */
export async function getGenerationStats(projectId: string): Promise<{
  totalGenerations: number
  totalCost: number
  successCount: number
  failureCount: number
  averageCost: number
}> {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('status, cost_cents')
      .eq('project_id', projectId)

    if (error) {
      throw error
    }

    const generations = (data || []) as any[]
    const totalCost = generations.reduce((sum, g) => sum + (g.cost_cents || 0), 0)
    const successCount = generations.filter((g) => g.status === 'completed').length
    const failureCount = generations.filter((g) => g.status === 'failed').length

    return {
      totalGenerations: generations.length,
      totalCost,
      successCount,
      failureCount,
      averageCost: generations.length > 0 ? Math.round(totalCost / generations.length) : 0,
    }
  } catch (error) {
    console.error('Error fetching generation stats:', error)
    throw error
  }
}
