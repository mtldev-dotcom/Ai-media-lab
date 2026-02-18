import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import { ProviderFactory } from '@/lib/ai/provider-factory'
import { resolveProviderName } from '@/lib/ai/provider-aliases'
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
  const { provider: rawProvider } = await params
  const provider = resolveProviderName(rawProvider)

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

    // Get user's API key for this provider (use raw name since that's how keys are stored)
    let apiKey: string
    try {
      apiKey = await getProviderAPIKey(user.id, rawProvider)
    } catch (error) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'NO_API_KEY',
          message: `No API key found for provider: ${rawProvider}`,
        },
        { status: 400 }
      )
    }

    // Create provider instance (use resolved name for factory lookup)
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
  const supabase = await createClient()
  return apiKeyManager.getActiveAPIKey(supabase, userId, provider)
}
