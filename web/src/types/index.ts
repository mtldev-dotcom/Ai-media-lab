/**
 * Core type definitions for AI Media Creation Workspace
 */

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Projects
// ============================================================================

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  budget_cents: number
  spent_cents: number
  settings: Record<string, any>
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  budget_cents?: number
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  budget_cents?: number
  thumbnail_url?: string
}

// ============================================================================
// Assets
// ============================================================================

export type AssetType = 'image' | 'video' | 'audio' | 'text'

export interface Asset {
  id: string
  project_id: string
  user_id: string
  type: AssetType
  name: string | null
  description: string | null
  file_url: string | null
  file_size_bytes: number | null
  file_format: string | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  generation_id: string | null
  thumbnail_url: string | null
  metadata: Record<string, any>
  tags: string[]
  favorite: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateAssetInput {
  project_id: string
  type: AssetType
  name: string
  description?: string
  file_url?: string
  file_size_bytes?: number
  file_format?: string
  metadata?: Record<string, any>
}

// ============================================================================
// Generations (AI API Calls)
// ============================================================================

export type GenerationType = 'text' | 'image' | 'video' | 'audio'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Generation {
  id: string
  project_id: string
  user_id: string
  provider: string // 'openai', 'anthropic', 'fal', etc.
  model: string
  generation_type: GenerationType
  prompt: string
  parameters: Record<string, any>
  status: GenerationStatus
  result: Record<string, any> | null
  error_message: string | null
  tokens_input: number | null
  tokens_output: number | null
  tokens_total: number | null
  cost_cents: number
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  created_at: string
  updated_at: string
}

export interface GenerationRequest {
  project_id: string
  type: GenerationType
  provider?: string // Will use default if not provided
  model?: string
  prompt: string
  parameters?: Record<string, any>
}

// ============================================================================
// API Keys
// ============================================================================

export interface UserAPIKey {
  id: string
  user_id: string
  provider: string
  key_name: string | null
  encrypted_key: string
  encryption_iv: string
  encryption_auth_tag: string
  encryption_salt: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface APIKeyWithoutSecret extends Omit<UserAPIKey, 'encrypted_key' | 'encryption_iv' | 'encryption_salt'> {
  key_preview?: string // First 4 chars for display
}

// ============================================================================
// Provider Configuration
// ============================================================================

export interface ProviderConfig {
  id: string
  user_id: string
  provider: string
  priority: number
  is_enabled: boolean
  fallback_provider: string | null
  rate_limit_per_minute: number
  monthly_budget_cents: number | null
  config: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProviderHealth {
  id: string
  provider: string
  user_id: string | null
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  last_success_at: string | null
  last_failure_at: string | null
  failure_count: number
  avg_response_time_ms: number | null
  error_message: string | null
  checked_at: string
}

// ============================================================================
// Analytics
// ============================================================================

export interface UsageAnalytics {
  id: string
  user_id: string
  project_id: string | null
  period_type: 'daily' | 'monthly'
  period_start: string
  provider: string | null
  model: string | null
  generation_type: GenerationType | null
  request_count: number
  success_count: number
  failure_count: number
  total_tokens: number
  total_cost_cents: number
  avg_duration_ms: number | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Budget Alerts
// ============================================================================

export type AlertType = 'threshold_reached' | 'budget_exceeded'

export interface BudgetAlert {
  id: string
  user_id: string
  project_id: string | null
  alert_type: AlertType
  threshold_cents: number | null
  current_spend_cents: number
  triggered_at: string
  acknowledged_at: string | null
  metadata: Record<string, any>
  created_at: string
}

// ============================================================================
// API Responses
// ============================================================================

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// UI State Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// ============================================================================
// Form Validation
// ============================================================================

export interface ValidationError {
  field: string
  message: string
}
