/**
 * Provider Router
 * Routes generation requests to appropriate providers with fallback logic
 */

import { BaseProvider, GenerationRequest, GenerationResponse, GenerationType } from './base-provider'
import { ProviderFactory } from './provider-factory'
import { supabase } from '@/lib/db/client'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'

export interface ProviderRoute {
  provider: string
  priority: number
  isEnabled: boolean
  fallbackProvider?: string
}

export interface RoutingContext {
  userId: string
  projectId?: string
  generationType: GenerationType
  preferredProvider?: string
}

/**
 * Provider Router with fallback and health checking
 */
export class ProviderRouter {
  /**
   * Get user's enabled providers sorted by priority
   */
  static async getUserProviders(userId: string): Promise<ProviderRoute[]> {
    try {
      const { data, error } = await supabase
        .from('provider_configs')
        .select('provider, priority, is_enabled, fallback_provider')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .order('priority', { ascending: true })

      if (error) {
        console.error('Error fetching user providers:', error)
        return []
      }

      return (data || []) as unknown as ProviderRoute[]
    } catch (error) {
      console.error('Error in getUserProviders:', error)
      return []
    }
  }

  /**
   * Get provider health status
   */
  static async getProviderHealth(
    provider: string,
    userId?: string
  ): Promise<{ healthy: boolean; status: string; error?: string }> {
    try {
      const query = supabase
        .from('provider_health')
        .select('status, error_message, last_failure_at')
        .eq('provider', provider)

      if (userId) {
        query.eq('user_id', userId)
      }

      const { data, error } = await query.single()

      if (error) {
        // Provider health record doesn't exist yet
        return { healthy: true, status: 'unknown' }
      }

      const healthy = data.status !== 'down'
      return {
        healthy,
        status: data.status,
        error: data.error_message || undefined,
      }
    } catch (error) {
      console.error('Error checking provider health:', error)
      return { healthy: false, status: 'error', error: String(error) }
    }
  }

  /**
   * Update provider health status
   */
  static async updateProviderHealth(
    provider: string,
    userId: string | null,
    success: boolean,
    error?: string,
    responseTime_ms?: number
  ): Promise<void> {
    try {
      const status = success ? 'healthy' : 'degraded'

      const { error: updateError } = await supabase
        .from('provider_health')
        .upsert(
          {
            provider,
            user_id: userId,
            status,
            last_success_at: success ? new Date().toISOString() : null,
            last_failure_at: !success ? new Date().toISOString() : null,
            failure_count: success ? 0 : 1,
            avg_response_time_ms: responseTime_ms,
            error_message: error,
            checked_at: new Date().toISOString(),
          },
          { onConflict: 'provider,user_id' }
        )

      if (updateError) {
        console.error('Error updating provider health:', updateError)
      }
    } catch (error) {
      console.error('Error in updateProviderHealth:', error)
    }
  }

  /**
   * Route generation request to best available provider
   */
  static async routeGeneration(
    context: RoutingContext,
    request: GenerationRequest
  ): Promise<{ provider: BaseProvider; providerName: string } | null> {
    // Get user's configured providers
    const userProviders = await this.getUserProviders(context.userId)

    if (userProviders.length === 0) {
      throw new Error('No providers configured for this user')
    }

    // Filter providers that support this generation type
    for (const providerRoute of userProviders) {
      try {
        // Check provider health
        const health = await this.getProviderHealth(providerRoute.provider, context.userId)
        if (!health.healthy) {
          console.warn(`Provider ${providerRoute.provider} is not healthy, trying next`)
          continue
        }

        // Get provider's API key
        let decryptedKey: string
        try {
          decryptedKey = await this.getProviderAPIKey(context.userId, providerRoute.provider)
        } catch (error) {
          console.warn(`No API key found for ${providerRoute.provider}`)
          continue
        }

        // Create provider instance
        const provider = ProviderFactory.createProvider(providerRoute.provider, decryptedKey)

        // Check if provider supports this generation type
        if (!provider.supports(request.type)) {
          console.warn(
            `Provider ${providerRoute.provider} does not support ${request.type}, trying next`
          )
          continue
        }

        return { provider, providerName: providerRoute.provider }
      } catch (error) {
        console.error(`Error routing to provider ${providerRoute.provider}:`, error)
        // Continue to next provider
        continue
      }
    }

    throw new Error(
      `No suitable provider found for generation type: ${request.type}. Ensure you have configured and enabled at least one provider that supports this type.`
    )
  }

  /**
   * Get decrypted API key for a provider
   */
  private static async getProviderAPIKey(userId: string, provider: string): Promise<string> {
    try {
      // Get the active API key for this provider
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        throw new Error(`No active API key found for ${provider}`)
      }

      // Decrypt the key
      const decrypted = await apiKeyManager.getDecryptedAPIKey(data.id, userId)
      return decrypted
    } catch (error) {
      throw new Error(`Failed to retrieve API key for ${provider}: ${String(error)}`)
    }
  }

  /**
   * Execute generation with automatic fallback on failure
   */
  static async executeWithFallback(
    context: RoutingContext,
    request: GenerationRequest,
    maxAttempts: number = 3
  ): Promise<{ response: GenerationResponse; provider: string }> {
    const userProviders = await this.getUserProviders(context.userId)
    let lastError: Error | null = null

    for (let attempt = 0; attempt < Math.min(maxAttempts, userProviders.length); attempt++) {
      try {
        const route = await this.routeGeneration(context, request)
        if (!route) {
          throw new Error('No suitable provider found')
        }

        const startTime = Date.now()
        const response = await route.provider.generate(request)
        const duration = Date.now() - startTime

        // Update provider health on success
        await this.updateProviderHealth(route.providerName, context.userId, true, undefined, duration)

        return { response, provider: route.providerName }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(
          `Attempt ${attempt + 1} failed for ${context.generationType} generation:`,
          lastError
        )

        // Update provider health on failure
        if (context.generationType) {
          await this.updateProviderHealth(
            context.generationType,
            context.userId,
            false,
            lastError.message
          )
        }

        // Continue to next attempt/provider
        continue
      }
    }

    throw new Error(
      `Generation failed after ${maxAttempts} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    )
  }
}
