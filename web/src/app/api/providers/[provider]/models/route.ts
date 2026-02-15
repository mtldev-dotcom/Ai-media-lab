import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/client'
import { ProviderFactory } from '@/lib/ai/provider-factory'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'
import type { APIResponse } from '@/types'

/**
 * GET /api/providers/[provider]/models
 * Get available models for a provider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be logged in',
        },
        { status: 401 }
      )
    }

    // Get user's API key for this provider
    let apiKey: string
    try {
      apiKey = await getProviderAPIKey(user.id, provider)
    } catch (error) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'NO_API_KEY',
          message: `No API key found for provider: ${provider}`,
        },
        { status: 400 }
      )
    }

    // Create provider instance
    const providerInstance = ProviderFactory.createProvider(provider, apiKey)

    // Get available models
    const models = await providerInstance.getAvailableModels()

    return NextResponse.json<APIResponse<string[]>>({
      success: true,
      data: models,
    })
  } catch (error) {
    console.error('[GET /api/providers/[provider]/models] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch provider models',
      },
      { status: 500 }
    )
  }
}

/**
 * Get decrypted API key for a provider
 */
async function getProviderAPIKey(userId: string, provider: string): Promise<string> {
  try {
    const { supabase } = await import('@/lib/db/client')

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

    const decrypted = await apiKeyManager.getDecryptedAPIKey(data.id, userId)
    return decrypted
  } catch (error) {
    throw new Error(`Failed to retrieve API key for ${provider}`)
  }
}
