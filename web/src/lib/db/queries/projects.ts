import { supabase as defaultClient } from '@/lib/db/client'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get all projects for the current user
 */
export async function getProjects(userId: string, supabase: SupabaseClient = defaultClient) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    throw error
  }

  return data as Project[]
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string, supabase: SupabaseClient = defaultClient) {
  const { data, error} = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    throw error
  }

  return data as Project
}

/**
 * Create a new project
 */
export async function createProject(userId: string, input: CreateProjectInput, supabase: SupabaseClient = defaultClient) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      budget_cents: input.budget_cents || 0,
      spent_cents: 0,
      settings: {},
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw error
  }

  return data as Project
}

/**
 * Update a project
 */
export async function updateProject(projectId: string, input: UpdateProjectInput, supabase: SupabaseClient = defaultClient) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      name: input.name,
      description: input.description,
      budget_cents: input.budget_cents,
      thumbnail_url: input.thumbnail_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    throw error
  }

  return data as Project
}

/**
 * Delete a project (soft delete - archive)
 */
export async function deleteProject(projectId: string, supabase: SupabaseClient = defaultClient) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error deleting project:', error)
    throw error
  }

  return data as Project
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: string, supabase: SupabaseClient = defaultClient) {
  // Get generation count
  const { count: generationCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('status', 'completed')

  // Get asset count
  const { count: assetCount } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('archived_at', null)

  // Get total cost
  const { data: costData } = await supabase
    .from('generations')
    .select('cost_cents')
    .eq('project_id', projectId)
    .eq('status', 'completed')

  const totalCost = costData?.reduce((sum, item) => sum + (item.cost_cents || 0), 0) || 0

  return {
    generationCount: generationCount || 0,
    assetCount: assetCount || 0,
    totalCost,
  }
}

/**
 * Search projects by name
 */
export async function searchProjects(userId: string, query: string, supabase: SupabaseClient = defaultClient) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching projects:', error)
    throw error
  }

  return data as Project[]
}
